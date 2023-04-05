import { Component, OnInit, SimpleChanges, Input } from '@angular/core';
import { LoaderService } from 'src/app/services/utils/loader.service';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.css']
})
export class SpinnerComponent implements OnInit {


  /********************************************************************************************/
  /**************************************** The attributes  ***********************************/
  /********************************************************************************************/

  @Input()  loading = false;//pére => fils is loading or not
  @Input()  firstTime = false;//pére => le serveur render.com prend quelques secondes pour Run la première fois

  /********************************************************************************************/
  /************************************* Initialization functions  ****************************/
  /*******************************************************************************************/

  constructor(public loader: LoaderService) { }

  /********************************************************************************************/
  /**************************************  The functions **************************************/
  /********************************************************************************************/

  //lifecycle hook is called when data-bound 'loading' directive changes.
  ngOnChanges(changes: SimpleChanges) {
    this.loader.setLoading(changes.loading?.currentValue)
  }

  ngOnInit(): void {
  }


}
