function createTestUser (name) {
        Accounts.createUser({username: name, email: name + '@test.com', password: 'test'})
        return Meteor.users.findOne({username: name})
}

function clearAll() {
        /* this should really be done by tinytest */
        Meteor.users.find().forEach(function (user) {
                Meteor.users.remove (user._id)
        })

        Roles.getAllRoles().forEach(function (role) {
                Roles.deleteRole(role.name)
        })

        Tasks.getAllTasks().forEach(function (task) {
                Tasks.deleteTask(task)
        })
}

clearAll()
Tinytest.add('create a user with no task does nothing new', function (test){
        var user = createTestUser('test')
        test.equal(user.task, undefined)
})

Tinytest.add('create a role with no task does nothing new', function (test){
        Roles.createRole('testrole')
        var user = createTestUser('test2')
        test.isUndefined(user.task)
        test.isUndefined(user.roles)
})

Tinytest.add('define a task, get a task', function (test){
        clearAll()
        Tasks.createTask('testtask', 'testrole')

        var roles = Roles.getAllRoles()
        var tasks = Tasks.getAllTasks()

        test.equal(roles.count(), 1, JSON.stringify(roles.fetch()))
        test.equal(tasks.count(), 1, JSON.stringify(tasks.fetch()))
})

Tinytest.add('define a task via createTasks, get a task', function (test){
        clearAll()
        Tasks.createTasks({testtask: 'testrole'})

        var roles = Roles.getAllRoles()
        var tasks = Tasks.getAllTasks()

        test.equal(roles.count(), 1, JSON.stringify(roles.fetch()))
        test.equal(tasks.count(), 1, JSON.stringify(tasks.fetch()))
})

Tinytest.add('define tasks via createTasks, get tasks', function (test){
        clearAll()
        Tasks.createTasks({
                testtask0: 'testrole0',
                testtask1: ['testrole10', 'testrole11'],
                testtask2: ['testrole20', 'testrole21', 'testrole22']
        })

        var roles = Roles.getAllRoles()
        var tasks = Tasks.getAllTasks()

        test.equal(roles.count(), 6, JSON.stringify(roles.fetch()))
        test.equal(tasks.count(), 3, JSON.stringify(tasks.fetch()))
})



Tinytest.add('roles get cleaned up', function (test){
        clearAll()
        Tasks.createTask('testtaskclean', 'testrole')
        Tasks.deleteTask('testtaskclean')

        var roles = Roles.getAllRoles()
        var tasks = Tasks.getAllTasks()

        test.equal(roles.count(), 0, JSON.stringify(roles.fetch()))
        test.equal(tasks.count(), 0, JSON.stringify(tasks.fetch()))
})

Tinytest.add('roles get cleaned up (array)', function (test){
        clearAll()
        Tasks.createTask('testtaskclean', ['testrole0', 'testrole1'])
        Tasks.deleteTask('testtaskclean')

        var roles = Roles.getAllRoles()
        var tasks = Tasks.getAllTasks()

        test.equal(roles.count(), 0, JSON.stringify(roles.fetch()))
        test.equal(tasks.count(), 0, JSON.stringify(tasks.fetch()))
})


Tinytest.add('roles get cleaned up, but not all', function (test){
        clearAll()
        Tasks.createTask('testtaskclean0', 'testrole0')
        Tasks.createTask('testtaskclean1', 'testrole1')
        Tasks.deleteTask('testtaskclean0')

        var roles = Roles.getAllRoles()
        var tasks = Tasks.getAllTasks()

        test.equal(roles.count(), 1, JSON.stringify(roles.fetch()))
        test.equal(tasks.count(), 1, JSON.stringify(tasks.fetch()))
})

Tinytest.add('roles get cleaned up, but not all (array)', function (test){
        clearAll()
        Tasks.createTask('testtaskclean0', ['testrole0', 'testrole1'])
        Tasks.createTask('testtaskclean1', ['testrole2', 'testrole3'])
        Tasks.deleteTask('testtaskclean0')

        var roles = Roles.getAllRoles()
        var tasks = Tasks.getAllTasks()

        test.equal(roles.count(), 2, JSON.stringify(roles.fetch()))
        test.equal(tasks.count(), 1, JSON.stringify(tasks.fetch()))
})

Tinytest.add('define a task, add to a user, check he\'s in role (string)', function (test){
        clearAll()
        Tasks.createTask('testtaskstring', 'testrole')
        var user = createTestUser('testuser')
        Tasks.addUsersToTasks(user, 'testtaskstring')
        test.isTrue(Roles.userIsInRole(user._id, 'testrole'), 'user is in role testrole')
})

Tinytest.add('remove a user from task, check he\'s not in role anymore (string)', function (test){
        clearAll()
        Tasks.createTask('testtaskstring', 'testrole')
        var user = createTestUser('testuser')
        Tasks.addUsersToTasks(user, 'testtaskstring')
        test.isTrue(Roles.userIsInRole(user._id, 'testrole'), 'user is in role testrole')
        Tasks.removeUsersFromTasks(user, 'testtaskstring')
        test.isFalse(Roles.userIsInRole(user._id, 'testrole'), 'user is not in role testrole')
})

Tinytest.add('define a task, add to a user, check he\'s in role (array)', function (test){
        clearAll()
        Tasks.createTask('testtaskarray', ['testrole0', 'testrole1'])
        var user = createTestUser('testuser')
        Tasks.addUsersToTasks(user, 'testtaskarray')
        test.isTrue(Roles.userIsInRole(user._id ,'testrole0'))
        test.isTrue(Roles.userIsInRole(user._id ,'testrole1'))
})

Tinytest.add('remove a user from task, check he\'s not in role anymore (array)', function (test){
        clearAll()
        Tasks.createTask('testtaskarray', ['testrole0', 'testrole1'])
        var user = createTestUser('testuser')
        Tasks.addUsersToTasks(user, 'testtaskarray')
        test.isTrue(Roles.userIsInRole(user._id, 'testrole0'))
        test.isTrue(Roles.userIsInRole(user._id, 'testrole1'))
        Tasks.removeUsersFromTasks(user, 'testtaskarray')
        test.isFalse(Roles.userIsInRole(user._id, 'testrole0'))
        test.isFalse(Roles.userIsInRole(user._id, 'testrole1'))
})

Tinytest.add('add user to 2 tasks fails', function (test){
        clearAll()
        var user = createTestUser('testuser')
        Tasks.createTask('test0', ['testRole0', 'testRole1'])
        Tasks.createTask('test1', ['testRole2', 'testRole3'])

        Tasks.addUsersToTasks(user, 'test0')
        test.throws (function () {
                Tasks.addUsersToTasks(user, 'test1')
        })

        test.isTrue (Roles.userIsInRole(user._id, 'testRole0'), '0')
        test.isFalse(Roles.userIsInRole(user._id, 'testRole2'), '2')
})

