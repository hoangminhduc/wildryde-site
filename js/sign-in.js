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
            
            const idToken = result.getIdToken().getJwtToken(); // ID Token
            const accessToken = result.getAccessToken().getJwtToken();
            const refreshToken = result.getRefreshToken().getToken();
            const userId = result.getIdToken().payload.sub; // Cognito User ID

            // Store authentication tokens in localStorage
            localStorage.setItem("cognitoIdToken", idToken);
            localStorage.setItem("cognitoAccessToken", accessToken);
            localStorage.setItem("cognitoRefreshToken", refreshToken);
            localStorage.setItem("cognitoUserId", userId);

            console.log("ID Token:", idToken);
            console.log("User ID:", userId);

            // Redirect to dashboard
            window.location.href = "test.html";
        },
        onFailure: function(err) {
            console.error("Sign-in failed: ", err.message || JSON.stringify(err));
            alert("Sign-in failed: " + err.message);
        }
    });
});
