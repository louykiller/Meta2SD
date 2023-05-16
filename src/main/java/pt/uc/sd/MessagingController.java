package pt.uc.sd;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import org.jsoup.HttpStatusException;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.net.ConnectException;
import java.rmi.NotBoundException;
import java.rmi.RemoteException;
import java.rmi.registry.LocateRegistry;
import java.util.ArrayList;
import java.util.List;

@Controller
public class MessagingController {

	// Função que vai receber os search terms mandados para /searchEngine/searchTerms e
    // devolve os resultados pelo "canal" /search/results
    @MessageMapping("/searchTerms")
    @SendTo("/search/results")
    public Message search(Message searchTerms) throws InterruptedException, RemoteException, NotBoundException {
        ServerActions ca = (ServerActions) LocateRegistry.getRegistry(7000).lookup("server");
        ArrayList<SearchResult> results = ca.search(searchTerms.content());
        return new Message(new Gson().toJson(results));
    }

    // Função que recebe URLS para indexar mandados para /searchEngine/indexURL
    @MessageMapping("/indexURL")
    public void indexURL(Message url) throws InterruptedException, RemoteException, NotBoundException {
        System.out.println("URL received " + url.content());
        ServerActions ca = (ServerActions) LocateRegistry.getRegistry(7000).lookup("server");
        ca.indexURL(url.content());
    }

    // Função que vai receber os pedidos de update mandados para /searchEngine/systemDetails e
    // devolve os resultados pelo "canal" /search/update
    @MessageMapping("/systemDetails")
    @SendTo("/search/update")
    public Message updateSystemDetails(Message message) throws InterruptedException {
        System.out.println("Message: " + message.content());
        Thread.sleep(2000);
        // TODO: Sempre que houver uma atualização enviar para o cliente
        // Por exemplo o updateDownloaderStatus ou updateBarrelStatus
        return new Message("Update!");
    }

    @MessageMapping("/getNews")
    @SendTo("/search/news")
    public Message getNews(Message searchTerms) throws InterruptedException, IOException, NotBoundException {
        String search = searchTerms.content();
        if (search == null) {
            return null;
        }
        String topStoriesEndpoint = "https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty";
        // Buscar todas as top stories
        RestTemplate restTemplate = new RestTemplate();
        List hackerNewsNewTopStories = restTemplate.getForObject(topStoriesEndpoint, List.class);
        assert hackerNewsNewTopStories != null;

        // TODO: Indexar todas as noticias com os searchTerms
        ServerActions ca = (ServerActions) LocateRegistry.getRegistry(7000).lookup("server");
        // Guardar todas as stories que tenham os searchTerms
        List<HackerNewsItemRecord> hackerNewsItemRecordList = new ArrayList<>();
        for (int i = 0; i <= hackerNewsNewTopStories.size(); i++) {
            // Ir buscar o URL da story
            Integer storyId = (Integer) hackerNewsNewTopStories.get(i);
            String storyItemDetailsEndpoint = String.format("https://hacker-news.firebaseio.com/v0/item/%s.json?print=pretty", storyId);
            HackerNewsItemRecord hackerNewsItemRecord = restTemplate.getForObject(storyItemDetailsEndpoint, HackerNewsItemRecord.class);
            // Verificar se existe e se o URL existe
            if (hackerNewsItemRecord == null || hackerNewsItemRecord.url() == null) { continue; }
            System.out.println("News number " + i + ": " + hackerNewsItemRecord.title() + " - " + hackerNewsItemRecord.url());
            // Verificar se contem os searchTerms
            List<String> searchTermsList = List.of(search.toLowerCase().split(" "));
            try {
                // Aceder ao url
                String doc = Jsoup.connect(hackerNewsItemRecord.url()).get().text();
                // Se sim adicionar à lista
                if (searchTermsList.stream().anyMatch(doc.toLowerCase()::contains)) {
                    System.out.println("Found!");
                    hackerNewsItemRecordList.add(hackerNewsItemRecord);
                }
            } catch (Exception e){
                continue;
            }
        }
        // Mandar em formato JSON
        String json = new Gson().toJson(hackerNewsItemRecordList);
        return new Message(json);
    }


    @MessageMapping("/login")
    @SendTo("/search/user")
    public UserInfo login(UserInfo user) throws InterruptedException, RemoteException, NotBoundException {
        System.out.println("Message: " + user);
        ServerActions ca = (ServerActions) LocateRegistry.getRegistry(7000).lookup("server");
        User u = ca.login(user.username(), user.password());
        if(u == null) return new UserInfo(null, null, null, "login");
        return new UserInfo(u.name, u.username, null, "login");
    }

    @MessageMapping("/register")
    @SendTo("/search/user")
    public UserInfo register(UserInfo user) throws InterruptedException, RemoteException, NotBoundException {
        System.out.println("Message: " + user);
        ServerActions ca = (ServerActions) LocateRegistry.getRegistry(7000).lookup("server");
        User u = ca.register(user.username(), user.password(), user.name());
        if(u == null) return new UserInfo(null, null, null, "register");
        return new UserInfo(u.name, u.username, null, "register");
    }

}
