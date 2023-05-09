package pt.uc.sd;

import java.io.Serializable;
import java.util.Objects;

public class User implements Serializable {
    public final String username;
    public final String password;
    public String name;

    public User(String username, String password, String name) {
        this.username = username;
        this.password = password;
        this.name = name;
    }

    @Override
    public int hashCode() {
        return Objects.hash(username, password);
    }
}
