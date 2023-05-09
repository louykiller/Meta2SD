package pt.uc.sd;// RMI Client – É o cliente RMI usado pelos utilizadores para aceder às funcionalidades do Googol.
// Pretende-se que este cliente tenha uma UI bastante simples e que
//se limite a invocar os métodos remotos no servidor RMI.

import java.rmi.RemoteException;
import java.rmi.registry.LocateRegistry;
import java.rmi.registry.Registry;
import java.rmi.server.UnicastRemoteObject;
import java.util.ArrayList;
import java.util.Scanner;

import static java.lang.System.exit;

public class RMIClient extends UnicastRemoteObject implements ClientPrint {
    public static User user;
    public RMIClient() throws RemoteException {
        super();
    }
    public void print(String s) throws RemoteException{
        System.out.println(s);
    }
    public static void main(String[] args) {
        user = null;
        try {
            Registry r = LocateRegistry.createRegistry(7001);
            r.rebind("client", new RMIClient());

            ServerActions ca = (ServerActions) LocateRegistry.getRegistry(7000).lookup("server");
            //ServerActions ca = (ServerActions) LocateRegistry.getRegistry("10.6.0.247", 7000).lookup("server");
            Scanner sc = new Scanner(System.in);
            while (true){
                System.out.println("_____________________________________________________________");
                System.out.println("|                   GOOGOL SEARCH ENGINE                    |");
                System.out.println("| 1 - Search                                                |");
                System.out.println("| 2 - Index URL                                             |");
                if(user == null){
                    System.out.println("| 3 - Log In                                                |");
                    System.out.println("| 4 - Register                                              |");
                }
                else
                    System.out.println("| 3 - Log Out                                               |");
                System.out.println("| 9 - System Details                                        |");
                System.out.println("| 0 - Exit                                                  |");
                System.out.println("_____________________________________________________________");

                try {
                    int input = Integer.parseInt(sc.nextLine());

                    switch (input) {
                        case 0 -> {
                            sc.close();
                            exit(0);
                        }
                        // Search
                        case 1 -> {
                            System.out.print("Googol Search:\n");
                            String searchWords = sc.nextLine();
                            // Get the results for the search words
                            ArrayList<SearchResult> results = ca.search(searchWords);
                            if (results.size() == 0)
                                System.out.println("No results found!");
                            else {
                                System.out.println(results.size() + " results");
                                int index = 0;
                                loop: while (true){

                                    for(int i = index; i < index + 10 && i < results.size(); i++){
                                        System.out.println(results.get(i) + "\n");
                                        if(user != null){
                                            System.out.println("Relevance: " + results.get(i).parentUrls.size());
                                            for(String u : results.get(i).parentUrls){
                                                System.out.println(u);
                                            }
                                            System.out.println();
                                        }
                                    }
                                    int m = Math.min(index + 10, results.size());
                                    System.out.println("=======================================");
                                    System.out.println("Showing results " + index + " to " + m + " out of " + results.size());
                                    System.out.println("=======================================");

                                    System.out.println("1 - Next Page; 2 - Previous Page; 0 - Exit;");
                                    int in = Integer.parseInt(sc.nextLine());
                                    switch (in){
                                        case 0 -> {
                                            break loop;
                                        }
                                        case 1 -> {
                                            if(index + 10 < results.size()){
                                                index += 10;
                                            }
                                            else {
                                                System.out.println("No next page");
                                            }
                                        }
                                        case 2 -> {
                                            if(index - 10 > 0){
                                                index -= 10;
                                            }
                                            else {
                                                System.out.println("No previous page");
                                            }
                                        }
                                        default -> {
                                            System.out.println("Wrong option");
                                        }
                                    }
                                }
                            }
                        }
                        // Index URL
                        case 2 -> {
                            System.out.print("URL: ");
                            String url = sc.nextLine();
                            // Index the URL to be
                            ca.indexURL(url);
                            System.out.println("You URL was sent to be indexed");
                        }
                        // Log In
                        case 3 -> {
                            if(user != null) {
                                ca.logout();
                                user = null;
                                System.out.println("Logged out successfully");
                            }
                            else {
                                System.out.println("Username: ");
                                String username = sc.nextLine();
                                System.out.println("Password: ");
                                String password = sc.nextLine();

                                user = ca.login(username, password);
                                if (user != null) {
                                    System.out.println("Logged In Successfully. Welcome back " + user.name);
                                } else {
                                    System.out.println("Couldn't log in. Please try again.");
                                }
                            }
                        }
                        // Register
                        case 4 -> {
                            if(user != null)
                                break;
                            System.out.println("Name: ");
                            String name = sc.nextLine();
                            System.out.println("Username: ");
                            String username = sc.nextLine();
                            System.out.println("Password: ");
                            String password = sc.nextLine();

                            user = ca.register(username, password, name);
                            if (user != null) {
                                System.out.println("Registered Successfully. Welcome " + user.name);
                            } else {
                                System.out.println("Couldn't register. Please try again with other credentials.");
                            }
                        }
                        // System Details
                        case 9 -> ca.printSystemDetails();
                        default -> System.out.println("Invalid input please try again!");
                    }
                } catch (NumberFormatException e){
                    System.out.println("Invalid input please try again!");
                }
            }
        } catch (Exception e) {
            System.out.println("Server offline. Try again later");
            e.printStackTrace();
            exit(1);
        }
    }
}
