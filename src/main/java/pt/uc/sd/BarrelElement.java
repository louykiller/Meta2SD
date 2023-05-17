package pt.uc.sd;

public class BarrelElement extends SystemElements {
    public BarrelElement(int id, int port, boolean active) {
        super(id, port, active);
    }

    @Override
    public String toString() {
        String t = "active";
        if(!this.active) {
            t = "inactive";
            this.active = false;
        }
        return "Barrel " + this.id + ", on port " + this.port + " is currently " + t;
    }

}
