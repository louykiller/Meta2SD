var stompClient = null;
var user = null;


// Codigo maioritariamente do stor
function connect() {
    var socket = new SockJS('/searchWebsocket');
    stompClient = Stomp.over(socket);
    stompClient.connect({}, function (frame) {
        //setConnected(true);
        console.log('Connected: ' + frame);
        // Subscreve este "canal" para receber os system updates
        stompClient.subscribe('/search/update', function (message) {
            // Chama a função newUpdate cada vez que recebe uma mensagem
            newUpdate(JSON.parse(message.body).content)
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
       console.log("Passwords dont match");
       // TODO: Notificacao
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
            alert("Couldn't log in. Invalid username/password");
        }
        else {
            alert("Logged In. Welcome back " + user["name"]);
        }
    }
    else {
            if(user["username"] == null){
                alert("Couldn't register. username already in use");
            }
            else {
                alert("Registered. Welcome " + user["name"]);
            }
    }
}

function index() {
    // Mandar URL para indexar para /searchEngine/indexURL
    stompClient.send("/searchEngine/indexURL", {}, JSON.stringify({'content': $("#searchBar").val()}));
    // Apagar o texto
    $("#searchBar").val("");
    // TODO: Pop up a confirmar
    alert("Your URL was sent to be indexed!");
}

function demandUpdates(){
    console.log("I WANT UPDATES!");
    // Mandar mensagem para /searchEngine/systemDetails a pedir updates
    stompClient.send("/searchEngine/systemDetails", {}, JSON.stringify({'content': "I WANT UPDATES!"}));
}

function newUpdate(update){
    // Alertar quando tem um update
    alert(update);
}

function test(mes){
    console.log("Test " + mes);
}

$(function () {
    connect();

    $( "#index" ).click(function (e) {
        // Indexar o que esta na searchBar
        index();
    });
    $( "#details" ).click(function (e) {
        // Abrir a página de detalhes do sistema
        test("details");
    });

    $( "#login" ).on("submit", function(e) {
        e.preventDefault();
        login();
    });

    $( "#register" ).on("submit", function(e) {
        e.preventDefault();
        register();
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


