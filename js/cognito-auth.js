/*global WildRydes _config AmazonCognitoIdentity AWSCognito*/

var WildRydes = window.WildRydes || {};

(function scopeWrapper($) {
    var signinUrl = '/signin.html';

    var poolData = {
        UserPoolId: _config.cognito.userPoolId,
        ClientId: _config.cognito.userPoolClientId
    };

    var userPool;

    if (!(_config.cognito.userPoolId &&
          _config.cognito.userPoolClientId &&
          _config.cognito.region)) {
        $('#noCognitoMessage').show();
        return;
    }

    userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

    if (typeof AWSCognito !== 'undefined') {
        AWSCognito.config.region = _config.cognito.region;
    }

    /** ✅ Sign Out Function */
    WildRydes.signOut = function signOut() {
        var cognitoUser = userPool.getCurrentUser();
        if (cognitoUser) {
            cognitoUser.signOut();
        }
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = signinUrl;
    };

    /** ✅ Get Authentication Token */
    WildRydes.authToken = new Promise(function fetchCurrentAuthToken(resolve, reject) {
        var cognitoUser = userPool.getCurrentUser();

        if (cognitoUser) {
            cognitoUser.getSession(function sessionCallback(err, session) {
                if (err) {
                    reject(err);
                } else if (!session.isValid()) {
                    resolve(null);
                } else {
                    resolve(session.getIdToken().getJwtToken());
                }
            });
        } else {
            resolve(null);
        }
    });

    /*
     * ✅ Cognito User Pool Functions
     */

    function register(email, password, onSuccess, onFailure) {
        var dataEmail = {
            Name: 'email',
            Value: email
        };
        var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);

        userPool.signUp(toUsername(email), password, [attributeEmail], null,
            function signUpCallback(err, result) {
                if (!err) {
                    onSuccess(result);
                } else {
                    onFailure(err);
                }
            }
        );
    }

    function signin(email, password, onSuccess, onFailure) {
        var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: toUsername(email),
            Password: password
        });

        var cognitoUser = createCognitoUser(email);
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function (session) {
                console.log("✅ Successfully Logged In");

                if (!session || !session.isValid()) {
                    console.error("❌ Error: Session is invalid.");
                    alert("Authentication failed. Please try again.");
                    return;
                }

                const idToken = session.getIdToken().getJwtToken();
                const accessToken = session.getAccessToken().getJwtToken();
                const refreshToken = session.getRefreshToken().getToken();

                // ✅ Ensure correct payload decoding
                const idTokenPayload = JSON.parse(atob(idToken.split(".")[1]));
                console.log("🔹 Full ID Token Payload:", idTokenPayload);

                if (!idTokenPayload || !idTokenPayload.sub) {
                    console.error("❌ Error: User ID (sub) not found in ID token.");
                    alert("Authentication failed. No user ID found.");
                    return;
                }

                const userId = idTokenPayload.sub; // ✅ Extract user ID safely

                // ✅ Store authentication tokens and user ID in `localStorage`
                localStorage.setItem("cognitoIdToken", idToken);
                localStorage.setItem("cognitoAccessToken", accessToken);
                localStorage.setItem("cognitoRefreshToken", refreshToken);
                localStorage.setItem("cognitoUserId", userId);

                console.log("🔹 ID Token:", idToken);
                console.log("🔹 User ID:", userId);

                // ✅ Redirect to dashboard after successful login
                window.location.href = "dashboard.html";
            },
            onFailure: function (err) {
                console.error("❌ Sign-in failed: ", err.message || JSON.stringify(err));
                alert("Sign-in failed: " + err.message);
            }
        });
    }

    function verify(email, code, onSuccess, onFailure) {
        createCognitoUser(email).confirmRegistration(code, true, function confirmCallback(err, result) {
            if (!err) {
                onSuccess(result);
            } else {
                onFailure(err);
            }
        });
    }

    function createCognitoUser(email) {
        return new AmazonCognitoIdentity.CognitoUser({
            Username: toUsername(email),
            Pool: userPool
        });
    }

    function toUsername(email) {
        return email.replace('@', '-at-');
    }

    /*
     * ✅ Event Handlers
     */

    $(function onDocReady() {
        $('#signinForm').submit(handleSignin);
        $('#registrationForm').submit(handleRegister);
        $('#verifyForm').submit(handleVerify);
    });

    function handleSignin(event) {
        var email = $('#emailInputSignin').val();
        var password = $('#passwordInputSignin').val();
        event.preventDefault();

        signin(email, password,
            function signinSuccess() {
                console.log('✅ Successfully Logged In');
                window.location.href = 'dashboard.html';
            },
            function signinError(err) {
                alert("Sign-in failed: " + err);
            }
        );
    }

    function handleRegister(event) {
        var email = $('#emailInputRegister').val();
        var password = $('#emailInputRegister').val();
        var password2 = $('#password2InputRegister').val();

        var onSuccess = function registerSuccess(result) {
            var cognitoUser = result.user;
            console.log('user name is ' + cognitoUser.getUsername());
            var confirmation = ('Registration successful. Please check your email inbox or spam folder for your verification code.');
            if (confirmation) {
                window.location.href = 'verify.html';
            }
        };
        var onFailure = function registerFailure(err) {
            alert(err);
        };
        event.preventDefault();

        if (password === password2) {
            register(email, password, onSuccess, onFailure);
        } else {
            alert('Passwords do not match');
        }
    }

    function handleVerify(event) {
        var email = $('#emailInputVerify').val();
        var code = $('#codeInputVerify').val();
        event.preventDefault();
        verify(email, code,
            function verifySuccess(result) {
                console.log('call result: ' + result);
                console.log('✅ Successfully verified');
                alert('Verification successful. You will now be redirected to the login page.');
                window.location.href = signinUrl;
            },
            function verifyError(err) {
                alert(err);
            }
        );
    }
}(jQuery));
