import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
@Component({
  selector: "app-ess-thermometer",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./ess-thermometer.component.html",
  styleUrls: ["./ess-thermometer.component.css"],
})
export class EssThermometerComponent {
  @Input() ess: number = 75;
  @Input() wide: boolean = false;
}
