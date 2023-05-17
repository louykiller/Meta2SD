var stompClient = null;
var currentResults = null;
var page = 1;
var maxPage = 1;
var hackerNews;

// Codigo maioritariamente do stor
function connect() {
    var socket = new SockJS('/searchWebsocket');
    stompClient = Stomp.over(socket);
    stompClient.connect({}, function (frame) {
        //setConnected(true);
        console.log('Connected: ' + frame);
        // Subscreve este "canal" para receber os resultados da pesquisa
        stompClient.subscribe('/search/results', function (message) {
            // Chama a função showResults cada vez que recebe uma mensagem
            showResults(JSON.parse(message.body).content);
        });
        // Subscreve este "canal" para receber os system updates
        stompClient.subscribe('/search/update', function (message) {
            // Chama a função newUpdate cada vez que recebe uma mensagem
            newUpdate(JSON.parse(message.body).content)
        });
        // Subscreve este "canal" para receber as news
        stompClient.subscribe('/search/news', function (message) {
            // Chama a função indexNews cada vez que recebe uma mensagem
            indexNews(JSON.parse(message.body).content)
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
    // Altera a visibilidade dos botões parentURLs
    $(".parentButton").css("visibility", "visible");
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

function search() {
    // Se for uma pesquisa vazia
    if($("#searchBar").val() == ""){
        $("#previous").css("visibility", "hidden");
        $("#next").css("visibility", "hidden");
        return;
    }
    // ir buscar os search terms para fazer a pesquisa
    stompClient.send("/searchEngine/searchTerms", {}, JSON.stringify({'content': $("#searchBar").val()}));
}

function updateResults(current){
    // Remover o previous se for a primeira pagina
    if(current == 1){
        $("#previous").css("visibility", "hidden");
    } else {
        $("#previous").css("visibility", "visible");
    }
    // Remover o next se for a última página
    if(current == maxPage){
        $("#next").css("visibility", "hidden");
    } else{
        $("#next").css("visibility", "visible");
    }
    // Atualizar a lista e os numeros
    $("#page" + page).removeClass("current_number");
    $("#page" + page).addClass("number");
    $("#page" + current).removeClass("number");
    $("#page" + current).addClass("current_number");
    $(".link").empty();
    for(let i = (current - 1) * 10; i < ( (current - 1) * 10) + 10 && i < currentResults.length; i++){
        const r = currentResults[i];
        $(".link").append('<div id="link' + i + '" style="display: flex; align-items: center; justify-content: space-between;"></div>')
        $("#link" + i).append('<div> <a class="title" href="' + r["url"] + '"><p>' + r["url"] + '</p>' +
                          '<h2>' + r["title"] + '</h2></a>' +
                          '<p class="citation">' + r["citation"] + '</p></div>');
        $("#link" + i).append('<button class="parentButton" id="parents' + i + '" style="margin-left: 12px; min-width: fit-content;">Parent URLs</button>');
        // Adicionar uma função aos botões para ver os parentURLs
        $("#parents" + i).click(function (e){
            getParentUrls(i);
        });
    }
    // Se o user estiver logged in então mostra os botões
    if(localStorage.getItem("name") != null){
        $(".parentButton").css("visibility", "visible");
    }
    // Altera a page
    page = current;
}

// Função para mostrar um pop-up com os parentURLs
function getParentUrls(index){
    // Coloca os urls em formato html
    const parentUrls = currentResults[index]["parentUrls"];
    var string = "";
    for(var p of parentUrls){
        string += '<a href="' + p + '">' + p + '</a><br>';
    }
    // Pop-up
    Swal.fire({
        title:"Parent URLs",
        html: string,
        confirmButtonText: 'Ok'
      })
}

// Função que recebe os resultados da pesquisa
function showResults(result) {
    const res = JSON.parse(result);
    // Guardar os novos resultados
    currentResults = res;
    page = 1;
    // Atualiza a maxPage
    maxPage = parseInt((res.length - 1) / 10) + 1;
    // Alterar o resultsCount e items de navegação se não houver resultados
    $("#resultsCount").text(res.length + " resultados encontrados");
    $(".numbers").empty();
    // Se houver resultados adicionar o numero de paginas
    if(res.length != 0){
        // Adicionar o numero de paginas necessárias
        for(let i = 0; i < maxPage; i++){
            const n = i + 1;
            $(".numbers").append('<a id="page' + n + '" class="number">' + n + '</a>');
            $("#page" + n).click(function(e) {
                updateResults(n);
            });
        }
    }
    // Atualizar os resultados
    updateResults(page);
}

function getNews(){
    // Se houver alguma pesquisa
    if($("#searchBar").val().length > 0){
    // Enviar para o canal getNews e notificar o user
    stompClient.send("/searchEngine/getNews", {}, JSON.stringify({'content': $("#searchBar").val()}));
    Swal.fire({
        title:"The Top Stories relative to '" + $("#searchBar").val() + "' will be indexed!",
        icon: 'info',
        confirmButtonText: 'Ok'
      })
    }
}

$(function () {
    connect();
    // Ir buscar os parametros
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const searchTerms = urlParams.get('searchTerms');
    // Mudar o title e a searchBar
    $(document).attr("title", searchTerms + ' - Pesquisa Googol');
    $("#searchBar").val(searchTerms);
    // Fazer a pesquisa
    setTimeout(() => { search(); }, 200);

    // Check if user is logged in
    const user = localStorage.getItem("name");
    if(user != null){
        loggedIn(user);
    }

    $(" #indexNews ").click(function (e){
        getNews();
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

    $("#previous").click(function (e){
        updateResults(page - 1);
    });
    $("#next").click(function (e){
        updateResults(page + 1);
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


