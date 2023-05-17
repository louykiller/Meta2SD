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
        stompClient.subscribe('/search/update', function (message) {
            // Chama a função newUpdate cada vez que recebe uma mensagem
            newUpdate(JSON.parse(message.body).content)
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
    // Vai buscar as credenciais do user
    const username = $( "#usernameLogin" ).val();
    const password = $( "#passwordLogin" ).val();
    let json = {'username': username, 'password': password};
    // Manda as credenciais para o canal de login
    stompClient.send("/searchEngine/login", {}, JSON.stringify(json));
}

function register(){
    // Vai buscar as credenciais do user
    const name = $( "#first_name" ).val() + ' ' + $( "#last_name" ).val();
    const username = $( "#username" ).val();
    const password1 = $( "#password1" ).val();
    const password2 = $( "#password2" ).val();
    // Verifica se as passwords coincidem, se não avisa o user
    if(password1 !== password2){
       Swal.fire({
        title: 'Passwords dont match!',
        icon: 'info',
        confirmButtonText: 'Ok'
      })
    }
    // Manda as credenciais para o canal de register
    else{
        let json = {'name': name, 'username': username, 'password': password1};
        stompClient.send("/searchEngine/register", {}, JSON.stringify(json));
    }
}

// Recebe as ações do user
function userAction(user){
    // Se for uma ação de login
    if(user["action"] == "login"){
        // Se for null significa que as credenciais estão erradas
        if(user["username"] == null){
            Swal.fire({
                title: 'Wrong credentials',
                text: 'Try again',
                icon: 'error',
                confirmButtonText: 'Ok'
              })
        }
        // Senão faz login
        else {
            Swal.fire({
                title: 'Welcome back ' + user["name"],
                icon: 'success',
                confirmButtonText: 'Ok'
              })
            // Fecha o pop-up e faz log in do user
            $('.close-btn').trigger('click');
            loggedIn(user["name"]);
        }
    }
    // Se for uma ação de register
    else {
        // Se for null significa que o username ja está em uso
        if(user["username"] == null){
            Swal.fire({
                title: 'Username already in use',
                text: 'Try again',
                icon: 'error',
                confirmButtonText: 'Ok'
              })
        }
        // Senão faz register
        else {
            Swal.fire({
                title: 'Welcome ' + user["name"],
                icon: 'success',
                confirmButtonText: 'Ok'
              })
            // Fecha o pop-up e faz log in do user
            $('.close-btn-register').trigger('click');
            loggedIn(user["name"]);
        }
    }
}

// Função para alterar visualmente o site quando o user faz login
function loggedIn(name){
    // Retira os botões de login e register
    $("#loggedOff").css("visibility", "hidden");
    // Mostra o icon do perfil com o seu nome
    $("#loggedIn").css("visibility", "visible");
    $("#name").text(name);
    localStorage.setItem("name", name);
}

function newUpdate(update){
    // Alertar quando tem um update
    Swal.fire({
        title:"New Update!",
        text: update,
        icon: 'info',
        confirmButtonText: 'Ok'
      })
}

function systemDetails(details){
    // Atualiza a lista dos detalhes de sistema
    $(".details_list").empty();
    for(let detail of details["systemDetails"]){
        $(".details_list").append('<li class="detail_item">' + detail + '</li>');
    }
    // Atualiza a lista das topSearches
    $(".top_list").empty();
    let i = 0;
    for(let search of details["topSearches"]){
        if(i++ == 10) break;
        $(".top_list").append('<li class="top_item"><a href="./searchpage.html?searchTerms=' + search + '">' + search + '</a></li>');
    }
}


$(function () {
    connect();
    // Fazer o pedido de systemDetails
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


