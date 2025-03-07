document.getElementById("signInForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const email = document.getElementById("emailInputSignin").value;
    const password = document.getElementById("passwordInputSignin").value;

    const poolData = {
        UserPoolId: window._config.cognito.userPoolId,
        ClientId: window._config.cognito.userPoolClientId
    };

    const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    const userData = {
        Username: email,
        Pool: userPool
    };

    const authenticationData = {
        Username: email,
        Password: password
    };

    const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
    const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function(result) {
            console.log("Sign-in successful!");
            const idToken = result.getIdToken().getJwtToken();
            console.log("ID Token: ", idToken);

            // Redirect user to a dashboard or home page
            window.location.href = "dashboard.html";
        },
        onFailure: function(err) {
            console.error("Sign-in failed: ", err.message || JSON.stringify(err));
            alert("Sign-in failed: " + err.message);
        }
    });
});
