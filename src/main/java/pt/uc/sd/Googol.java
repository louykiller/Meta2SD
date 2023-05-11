package pt.uc.sd;// Main class que vai iniciar todas as outras classes incluindo os indexStorageBarrels, RMISearchModule e os Downloaders

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.*;
import java.rmi.RemoteException;
import java.util.*;

@SpringBootApplication
public class Googol {

    static class Shutdown extends Thread {
        public List<String> urlsQueue;
        public Set<String> urlsVisited;
        public Shutdown(List<String> urlsQueue, Set<String> urlsVisited){
            this.urlsQueue = urlsQueue;
            this.urlsVisited = urlsVisited;
        }
        public void run() {
            // Save the urlsQueue in a file
            try {
                System.out.println("A atualizar urlsQueue");
                File f = new File("urlsQueue.txt");
                FileWriter fw = new FileWriter(f);
                BufferedWriter bw = new BufferedWriter(fw);
                for(String url : urlsQueue){
                    bw.write(url + "\n");
                }
                bw.close();
            } catch (IOException e) {
                System.out.println("Error writing to urls queue file");
            }
            // Save the urlsVisited in a file
            try {
                System.out.println("A atualizar urlsVisited");
                File f = new File("urlsVisited.txt");
                FileWriter fw = new FileWriter(f);
                BufferedWriter bw = new BufferedWriter(fw);
                for(String url : urlsVisited){
                    bw.write(url + "\n");
                }
                bw.close();
            } catch (IOException e) {
                System.out.println("Error writing to urls visited file");
            }
        }
    }

    public static void main(String[] args) throws InterruptedException, RemoteException {
        // Spring App
        SpringApplication.run(Googol.class, args);


        // Criar listas sincronizadas
        List<String> urlsQueue = Collections.synchronizedList(new LinkedList<>());
        Set<String> urlsVisited = Collections.synchronizedSet(new HashSet<String>());
        // This is to save all the urls in the queue when we shut down the program
        Runtime.getRuntime().addShutdownHook(new Shutdown(urlsQueue, urlsVisited));
        // Load the previous urls
        try {
            File f = new File("urlsQueue.txt");
            FileReader fr = new FileReader(f);
            BufferedReader br = new BufferedReader (fr);
            String s;
            while((s = br.readLine()) != null){
                urlsQueue.add(s);
            }
            br.close();
        } catch (EOFException e) {
            // Do nothing
        } catch (IOException e) {
            System.out.println("Error reading urls queue file");
        }
        // Load the previous visited urls
        try {
            File f = new File("urlsVisited.txt");
            FileReader fr = new FileReader(f);
            BufferedReader br = new BufferedReader (fr);
            String s;
            while((s = br.readLine()) != null){
                urlsVisited.add(s);
            }
            br.close();
        } catch (EOFException e) {
            // Do nothing
        } catch (IOException e) {
            System.out.println("Error reading urls visited file");
        }

        // Ligar o server
        try {
            RMISearchModule rsm = new RMISearchModule(urlsQueue);
        } catch (RemoteException e){
            System.out.println("Error initiating server");
        }

        System.out.println("A iniciar os downloaders");
        // Criar e iniciar as threads dos downloaders
        ArrayList<Thread> downloaders = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            downloaders.add(new Thread(new Downloader(urlsQueue, urlsVisited, i)));
            downloaders.get(i).start();
        }

        System.out.println("A iniciar os barrels");
        // Criar e inicar os barrels
        ArrayList<Thread> barrels = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            barrels.add(new Thread(new IndexStorageBarrel(i)));
            barrels.get(i).start();
        }
    }
}