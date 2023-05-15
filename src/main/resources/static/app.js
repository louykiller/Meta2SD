var stompClient = null;

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
        stompClient.subscribe('/user', function (message) {
            // Chama a função manageUser cada vez que recebe uma mensagem
            manageUser(JSON.parse(message.body).content)
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

function manageUser(message){
    console.log(message);
}

// TODO: ainda por fazer
function userAction(){
    let json = {'action': 'login', 'username': 'username', 'password': 'password'};
    console.log(json);
    stompClient.send("/searchEngine/userAction", {}, JSON.stringify(json));
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

    $( "#submitLogin" ).click(function(e) {
        e.preventDefault();
        test("Logged In " + $("#usernameLogin").val());
    });

    $( "#submitRegister" ).click(function(e) {
        e.preventDefault();
        test("Registered " + $("#username").val());
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


