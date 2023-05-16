var stompClient = null;


// Codigo maioritariamente do stor
function connect() {
    var socket = new SockJS('/searchWebsocket');
    stompClient = Stomp.over(socket);
    stompClient.connect({}, function (frame) {
        //setConnected(true);
        console.log('Connected: ' + frame);
        // Subscreve este "canal" para receber os system updates
        stompClient.subscribe('/search/system', function (message) {
            // Chama a função newUpdate cada vez que recebe uma mensagem
            systemDetails(JSON.parse(message.body))
        });
        // Subscreve este "canal" para gerir o user
        stompClient.subscribe('/search/user', function (message) {
            // Chama a função userAction cada vez que recebe uma mensagem
            userAction(JSON.parse(message.body))
        });
    });
}

// Codigo do stor
function disconnect() {
    if (stompClient !== null) {
        stompClient.disconnect();
    }
    //setConnected(false);
    console.log("Disconnected");
}

function login(){
    const username = $( "#usernameLogin" ).val();
    const password = $( "#passwordLogin" ).val();
    let json = {'username': username, 'password': password};
    stompClient.send("/searchEngine/login", {}, JSON.stringify(json));
}

function register(){
    const name = $( "#first_name" ).val() + ' ' + $( "#last_name" ).val();
    const username = $( "#username" ).val();
    const password1 = $( "#password1" ).val();
    const password2 = $( "#password2" ).val();
    if(password1 !== password2){
        Swal.fire({
            title: 'Passwords dont match!',
            icon: 'info',
            confirmButtonText: 'Ok'
          })
    }
    else{
        let json = {'name': name, 'username': username, 'password': password1};
        console.log(json);
        stompClient.send("/searchEngine/register", {}, JSON.stringify(json));
    }
}

function userAction(user){
    console.log(user);
    if(user["action"] == "login"){
        if(user["username"] == null){
            Swal.fire({
                title: 'Wrong credentials',
                text: 'Try again',
                icon: 'error',
                confirmButtonText: 'Ok'
              })
        }
        else {
            Swal.fire({
                title: 'Welcome back ' + user["name"],
                icon: 'success',
                confirmButtonText: 'Ok'
              })
            $('.close-btn').trigger('click');
            loggedIn(user["name"]);
        }
    }
    else {
        if(user["username"] == null){
            Swal.fire({
                title: 'Username already in use',
                text: 'Try again',
                icon: 'error',
                confirmButtonText: 'Ok'
              })
        }
        else {
            Swal.fire({
                title: 'Welcome ' + user["name"],
                icon: 'success',
                confirmButtonText: 'Ok'
              })
            $('.close-btn-register').trigger('click');
            loggedIn(user["name"]);
        }
    }
}

function loggedIn(name){
    $("#loggedOff").css("visibility", "hidden");
    $("#loggedIn").css("visibility", "visible");
    $("#name").text(name);
    localStorage.setItem("name", name);
}

function systemDetails(details){
    console.log(details);
    for(let detail of details["systemDetails"]){
        $(".details_list").append('<li class="detail_item">' + detail + '</li>');
    }
    let i = 0;
    for(let search of details["topSearches"]){
        if(i++ == 10) break;
        $(".top_list").append('<li class="top_item"><a href="./searchpage.html?searchTerms=' + search + '">' + search + '</a></li>');
    }
}


$(function () {
    connect();
    setTimeout(() => { stompClient.send("/searchEngine/systemDetails", {}, JSON.stringify({'content': 'details please'})); }, 200);

     // Check if user is logged in
    const user = localStorage.getItem("name");
    if(user != null){
        loggedIn(user);
    }

    $( "#details" ).click(function (e) {
        // Abrir a página de detalhes do sistema
        stompClient.send("/searchEngine/systemDetails", {}, JSON.stringify({'content': "updates please"}));

    });
    $( "#login" ).on("submit", function(e) {
        e.preventDefault();
        login();
    });
    $( "#register" ).on("submit", function(e) {
        e.preventDefault();
        register();
    });
    $(".logOut").click(function (e){
        localStorage.removeItem("name");
        Swal.fire({
            title:"Logged Out!",
            icon: 'info',
            confirmButtonText: 'Ok'
          })
    });

    /* mostrar e sair do popup do log in*/
    $("#show-login").click(function(){
        $(".popup_login").addClass("active");
        $(".total").css("display", "flex");
    });
     $(".close-btn").click(function(){
        $(".popup_login").removeClass("active");
        $(".total").css("display", "none");
     });

    /* mostrar e sair do popup do register*/
    $("#show-register").click(function(){
        $(".popup_register").addClass("active");
        $(".total_register").css("display", "flex");
    });
    $(".close-btn-register").click(function(){
        $(".popup_register").removeClass("active");
        $(".total_register").css("display", "none");
    });

    /* redirecionar para o popup do register */
    $("#redirect_signUp").click(function(){
        $(".popup_login").removeClass("active");
        $(".total").css("display", "none");
    });
    $("#redirect_signUp").click(function(){
        $(".popup_register").addClass("active");
        $(".total_register").css("display", "flex");
    });

    /* redirecionar para o popup do login */
    $("#redirect_signIn").click(function(){
        $(".popup_register").removeClass("active");
        $(".total_register").css("display", "none");
    });
    $("#redirect_signIn").click(function(){
        $(".popup_login").addClass("active");
        $(".total").css("display", "flex");
    });
});

