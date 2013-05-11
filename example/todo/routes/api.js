//user
// GET
exports.users = function (req, res) {
    req.users.find().toArray(function(err, result) {
        handle(err, res, result);
    });
};

exports.user = function (req, res) {
    var id = req.id;
    req.users.findOne({_id:id}, function(err, result) {
        handle(err, res, result);
    });
};

// POST
exports.addUser = function (req, res) {
    delete req.body._csrf;
    req.users.insert(req.body, function(err, result) {
        handle(err, res, result[0]);
    });
};

// PUT
exports.editUser = function (req, res) {
    var id = req.id;
    delete req.body._id;
    delete req.body._csrf;
    req.users.update({_id:id}, req.body, function(err, result) {
        handle(err, res, result);
    });
};

// DELETE
exports.deleteUser = function (req, res) {
    var id = req.id;
    req.users.remove({_id:id}, function(err, result) {
        handle(err, res, result);
    });
};


//task
// GET
exports.tasks = function (req, res) {
    req.tasks.find().toArray(function(err, result) {
        handle(err, res, result);
    });
};

exports.task = function (req, res) {
    var id = req.id;
    req.tasks.findOne({_id:id}, function(err, result) {
        handle(err, res, result);
    });
};

// POST
exports.addTask = function (req, res) {
    delete req.body._csrf;
    req.tasks.insert(req.body, function(err, result) {
        handle(err, res, result[0]);
    });
};

// PUT
exports.editTask = function (req, res) {
    var id = req.id;
    delete req.body._id;
    delete req.body._csrf;
    req.tasks.update({_id:id}, req.body, function(err, result) {
        handle(err, res, result);
    });
};

// DELETE
exports.deleteTask = function (req, res) {
    var id = req.id;
    req.tasks.remove({_id:id}, function(err, result) {
        handle(err, res, result);
    });
};

//task comment
// GET
exports.tasksComments = function (req, res) {
    var id = req.id;
    req.tasks.find({_id:id}, { comments:1}).toArray(function(err, result) {
        handle(err, res, result);
    });
};

exports.taskComment = function (req, res) {
    var id = req.id;
    var iid = req.iid;
    req.tasks.findOne({_id:id, 'comments.id':iid}, function(err, result) {
        handle(err, res, result);
    });
};

// POST
exports.addTaskComment = function (req, res) {
    delete req.body._csrf;
    delete req.body._id;
    req.body.id = uid();
    var id = req.id;
    req.tasks.update({_id:id}, { $push: { comments : req.body } }, function(err, result) {
        handleResult(err, res, result, req.tasks, id);
    });
};

// PUT
exports.editTaskComment = function (req, res) {
    var id = req.id;
    var iid = req.iid;
    delete req.body._id;
    delete req.body._csrf;
    req.tasks.update({_id:id, 'comments.id':iid}, { $set: { 'comments.$' : req.body } }, function(err, result) {
        handleResult(err, res, result, req.tasks, id);
    });
};

// DELETE
exports.deleteTaskComment = function (req, res) {
    var id = req.id;
    var iid = req.iid;
    req.tasks.update({_id:id}, { $pull: { comments : {id:iid} } }, function(err, result) {
        handleResult(err, res, result, req.tasks, id);
    });
};



function handleResult(err, res, result, collection, id) {
    if (err) {
        handle(err, res, result);
    } else {
        collection.findOne({_id: id}, function (err, result) {
            handle(err, res, result);
        });
    }
}

function handle(err, res, val) {
    if (err) {
        res.send(500, { error: err.message });
        console.log(err.stack);
    } else {
        res.json(val);
    }
}

function uid() {
    return "" + new Date().getTime();
}