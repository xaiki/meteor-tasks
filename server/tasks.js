var debug = Npm.require('debug')('xaiki:tasks#server')
var TasksCollection = new Meteor.Collection('xaiki:tasks')

function allButAdmin(userId) {
        return ! Roles.userIsInRole(userId, 'admin')
}

TasksCollection.deny({
        insert: allButAdmin,
        update: allButAdmin,
        remove: allButAdmin
})

Meteor.publish('xaiki:tasks', function () {
        if (! this.userId || ! Roles.userIsInRole(this.userId, 'admin'))
                return [];

        return TasksCollection.find()
})

function addRolesToUser (id, roles) {
        return applyRolesToUser(Roles.addUsersToRoles, id, roles)
}

function removeRolesFromUser (id, roles) {
        return applyRolesToUser(Roles.removeUsersFromRoles, id, roles)
}

function applyRolesToUser(fn, id, roles) {
        if (typeof roles === "string")
                roles = [roles]

        roles.forEach(function (role){
                fn.apply(this, [id].concat(role))
        })
}


function createAllRoles(newRoles) {
        var roles = Roles.getAllRoles().fetch()

        if (typeof newRoles === "string")
                newRoles = [newRoles]

        newRoles.forEach(function (role){
                if (roles.indexOf(role) == -1)
                        Roles.createRole(role)
        })
}

function cleanUnusedRoles() {
        var usedRoles = []
        TasksCollection.find().forEach(function (task) {
                usedRoles = _.uniq(usedRoles.concat(task.roles))
        })

        var roles = _.map (Roles.getAllRoles().fetch(), function (role){
                return role.name;
        })
        _.difference(roles, usedRoles).forEach(function(role){
                Roles.deleteRole (role)
        })
}

TasksCollection.before.insert(function (userId, doc) {
        if (typeof doc.roles === "string")
                doc.roles = [doc.roles]
        return doc
})

TasksCollection.after.insert(function (userId, doc) {
        createAllRoles(doc.roles)

        Meteor.users.find({task: doc.name}).forEach(function (user) {
                debug ('found user', user, 'with task', doc.name, 'adding it roles', doc.roles)
                addRolesToUser(user._id, doc.roles)
        })
})

TasksCollection.after.update(function (userId, doc, fieldNames, modifier, options) {
        var self = this

        if (doc.roles != this.previous.roles) {
                createAllRoles(doc.roles)
                cleanUnusedRoles()
        }

        Meteor.users.find({task: doc.name}).forEach(function (user) {
                /* naive approach, we remove the user from all the
                 roles he was in, and then put it back in, this saves
                 us diffing… actually, if we want this to work for
                 multiple tasked users we should re-apply all of the
                 user tasks… */
                removeRolesFromUser (user._id, self.previous.roles)
                addRolesToUser (user._id, doc.roles)
                debug ('task removing: ', self.previous.roles)
                debug ('task adding  : ', doc.roles)

                if (doc.name != self.previous.name)
                        Meteor.users.update(user._id, {$set: {task: doc.name}})
        })
})

TasksCollection.after.remove(function (userId, doc) {
        cleanUnusedRoles()
        
        Meteor.users.find({task: doc.name}).forEach(function (user) {
                addRolesToUser(user._id, doc.roles)
                Meteor.users.update(user._id, {$unset: {task: ""}})
        })
})

Meteor.users.after.insert(function (userId, doc){
        if (! doc.task)
                return

        var roles = TasksCollection.findOne({name: doc.task}).roles
        addRolesToUser (doc._id, roles)
})

Meteor.users.after.update(function (userId, doc, fieldNames, modifier, options) {
        debug ('updated', doc, this.previous, modifier)
        if ((! doc.task && ! this.previous.task) || (doc.task === this.previous.task))
                return

        debug ('tasks', this.previous.task, doc.task)
        var previous = TasksCollection.findOne({name: this.previous.task})
        if (previous) {
                debug ('removing: ', previous.roles)
                removeRolesFromUser(doc._id, previous.roles)
        }

        if (! doc.task)
                return

        var task = TasksCollection.findOne({name: doc.task})

        if (! task)
                throw new Meteor.Error ("Requested non existing task: " + doc.task)

        debug ('adding  : ', task.roles)
        addRolesToUser (doc._id, task.roles)
})

function usersNamesForEach (users, names, fn) {
        if (typeof users === "string" || ! (users instanceof Array))
                users = [users]

        if (typeof names === "string" || ! (names instanceof Array))
                names = [names]

        if (names.length > 1)
                throw new Meteor.Error ("only one task per user is supported")

        debug (users, names)

        users.forEach (function (user) {
                if (typeof user === "string")
                        user = Meteor.users.findOne(user, {fields: {task: 1}})

                names.forEach (function (name) {
                        fn (user, name)
                })
        })
}

/**
 * Always publish logged-in user's roles so client-side
 * checks can work.
 */
Meteor.publish(null, function () {
  var userId = this.userId,
      fields = {task:1}

  return Meteor.users.find({_id:userId}, {fields: fields})
})

Tasks = {
        addUsersToTasks: function (users, tasks) {
                return usersNamesForEach (users, tasks, function (user, name){
                        var task = Tasks.getTasksForUser(user._id)
                        debug('add user', task, user, name)
                        if (task)
                                throw new Meteor.Error ("user already in task: " + task)

                        debug ('add task', task, Tasks.getTasksForUser(user._id))
                        Meteor.users.update(user, {$set: {task: name}})
                })
        },
        createTask: function (name, roles) {
                TasksCollection.insert({name: name, roles: roles})
        },
        createTasks: function (options) {
                _.each(options, function (v, k){
                        Tasks.createTask(k, v)
                })
        },
        deleteTask: function (name) {
                if (typeof name != "string")
                        name = name.name

                Meteor.users.find({task: name}).forEach(function () {
                        throw new Meteor.Error("Task in use")
                })

                TasksCollection.remove({name: name})
        },
        getAllTasks: function (query) {
                query = query || {}
                return TasksCollection.find(query)
        },
        getGroupsForUser: function () { throw new Meteor.Error ("NOT IMPLEMENTED")},
        getTasksForUser: function (userId) {
                return Meteor.users.findOne (userId, {fields: {task:1}}).task
        },
        getUsersInTask: function (name) {
                return Meteor.users.find({task: name})
        },
        removeUsersFromTasks: function (users, tasks) {
                return usersNamesForEach (users, tasks, function (user, name){
                        if (Tasks.getTasksForUser(user._id) != name)
                                throw new Meteor.Error ("user not in task: " + name)

                        Meteor.users.update(user, {$unset: {task: ''}})
                })
        },
        setUserTasks: function () { throw new Meteor.Error ("NOT IMPLEMENTED")},
}
