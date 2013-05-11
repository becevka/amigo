
# amigo

AngularJS MongoDB Express Node.js project generator.
Allows easily scaffold project layout with CRUD operations and UI skeleton.

Your project will depend on Mongoskin, Express/Jade/Stylus and JQuery/Angular/Bootstrap for UI

Mongo Session store, CSRF protection and Authorization support are built-in.

## Installation

    $ npm install -g amigo

## Usage

    amigo [path]

Next you will be interactively asked on different project properties.

Among all you will be asked to scaffold resources, though amigo do not use mongoose schema, resources are used
to generate resource bindings for AngularJS and Express and UI.

When scaffolding resources you should provide resource name, for ex.

    task

then resource fields with field types

    text, owner, due_date:date

to specify inner resources (like /task/12/comments/2) use '$' before resource name and link it as field type.

    Resource name:

    task

    Resource fields:

    text, owner, due_date:date, comments:$comment

    Inner resource name:

    $comment

    Inner resource fields

    text, author, post_date:date

## TODO

    Tests
    Linked resources
    OAuth

## License 

(The MIT License)

Copyright (c) 2013 Wolf Bas &lt;becevka@gmail.coom&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.