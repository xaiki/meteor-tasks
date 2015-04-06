Tasks: Simple Task package to be used over alanning:roles
======

Roles do almost all you want, but they describe actions:

-   read user collection
-   add products record
-   remove products record
-   access banking information

that is great for clear templating code, but it's a bit tricky to combine
with business logic like:

-   shop manager
-   reviewer
-   client

that's where Tasks come into Play, it allows to define, on the server only,
'tasks mappings for alanning:roles'.

# API<a id="sec-1" name="sec-1"></a>

the public API is made to mimic alanning:roles so that you don't get any
weird surprises.

## addUsersToTasks: function (users, tasks)<a id="sec-1-1" name="sec-1-1"></a>

takes in arrays of `users` and `tasks` names

## createTask: function (name, roles)<a id="sec-1-2" name="sec-1-2"></a>

creates new task named `name` with roles `roles`

## createTasks: function (options)<a id="sec-1-3" name="sec-1-3"></a>

create tasks taking an object as argument, tasks will be created with the
keys, roles taken from the values:

    Tasks.createTasks({
            testtask0: 'testrole0',
            testtask1: ['testrole10', 'testrole11'],
            testtask2: ['testrole20', 'testrole21', 'testrole22']
    })

## deleteTask: function (name)<a id="sec-1-4" name="sec-1-4"></a>

remove task `name`

## getAllTasks: function ([query])<a id="sec-1-5" name="sec-1-5"></a>

returns a cursor to the Tasks collection.
takes an optional query parameter

## getTasksForUser: function (userId)<a id="sec-1-6" name="sec-1-6"></a>

returns the task for the current user, the gramar is wrong, but I didn't
want to diverge from getRolesForUser from alanning:roles.

## getUsersInTask: function (name)<a id="sec-1-7" name="sec-1-7"></a>

return a cursor to a all users with task `name`

## removeUsersFromTasks: function (users, tasks)<a id="sec-1-8" name="sec-1-8"></a>

removes users `users` from tasks `tasks`

## Unimplemented functions<a id="sec-1-9" name="sec-1-9"></a>

-   getGroupsForUser
-   setUserTasks
