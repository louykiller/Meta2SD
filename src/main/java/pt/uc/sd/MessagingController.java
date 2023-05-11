package pt.uc.sd;

import com.google.gson.Gson;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.HtmlUtils;

import java.rmi.NotBoundException;
import java.rmi.RemoteException;
import java.rmi.registry.LocateRegistry;
import java.rmi.registry.Registry;
import java.util.ArrayList;
import java.util.List;

@Controller
public class MessagingController {

	// Função que vai receber os search terms mandados para /searchEngine/searchTerms e
    // devolve os resultados pelo "canal" /search/results
    @MessageMapping("/searchTerms")
    @SendTo("/search/results")
    public Message search(Message searchTerms) throws InterruptedException, RemoteException, NotBoundException {
        System.out.println("Search for " + searchTerms.content());
        // TODO: Chamar RMI do search e devolver os search results em JSON
        ServerActions ca = (ServerActions) LocateRegistry.getRegistry(7000).lookup("server");
        ArrayList<SearchResult> results = ca.search(searchTerms.content());
        /*
        // TESTE
        ArrayList<SearchResult> test = new ArrayList<>();
        test.add(new SearchResult("http://result1.com", "The title 1", "Cool citation 1"));
        test.add(new SearchResult("http://result2.com", "The title 2", "Cool citation 2"));
        test.add(new SearchResult("http://result3.com", "The title 3", "Cool citation 3"));
        String json = new Gson().toJson(test);
        */

        String json = new Gson().toJson(results);
        return new Message(json);
    }

    // Função que recebe URLS para indexar mandados para /searchEngine/indexURL
    @MessageMapping("/indexURL")
    public void indexURL(Message url) throws InterruptedException, RemoteException, NotBoundException {
        System.out.println("URL received " + url.content());
        // TODO: Indexar URL
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
        return new Message("Update!");
    }

    @MessageMapping("/getNews")
    @SendTo("/search/news")
    public Message getNews(Message searchTerms) throws InterruptedException, RemoteException, NotBoundException {
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
            if (hackerNewsItemRecord == null) { continue; }
            // Verificar se contem os searchTerms
            List<String> searchTermsList = List.of(search.toLowerCase().split(" "));
            // TODO: Fazer para o texto do url e não para o titulo
            // Se sim adicionar à lista
            if (searchTermsList.stream().anyMatch(hackerNewsItemRecord.title().toLowerCase()::contains)) {
                hackerNewsItemRecordList.add(hackerNewsItemRecord);
                ca.indexURL(hackerNewsItemRecord.url());
            }
        }
        // Mandar em formato JSON
        String json = new Gson().toJson(hackerNewsItemRecordList);
        return new Message(json);
    }

}
