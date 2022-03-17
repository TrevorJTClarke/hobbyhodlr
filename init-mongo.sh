mongo -- "$MONGO_AUTH_TABLE" <<EOF
    var rootUser = '$MONGO_USERNAME';
    var rootPassword = '$MONGO_PASSWORD';
    var admin = db.getSiblingDB('admin');
    admin.auth(rootUser, rootPassword);

    var user = '$MONGO_USERNAME';
    var passwd = '$MONGO_PASSWORD';
    db.createUser({user: user, pwd: passwd, roles: ["readWrite"]});
EOF
