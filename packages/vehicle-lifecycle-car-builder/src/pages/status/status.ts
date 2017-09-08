import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Http, Response } from '@angular/http';

/**
 * Generated class for the StatusPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage()
@Component({
  selector: 'page-status',
  templateUrl: 'status.html',
})
export class StatusPage {
  car: Object;
  stage: Array<String>;
  relativeDate: any;
  config: any;
  insureWebsocket: any;
  order: any;

  constructor(public navCtrl: NavController, public navParams: NavParams, private http: Http) {
    this.car = navParams.get('car');
    this.stage = [Date.now() + ''];

    this.relativeDate = function(input, start) {
      if (input) {
        input = Date.parse(input);
        start = Date.parse(start);
        var diff = input - start;
        diff = diff / 1000
        diff = Math.round(diff);

        var result = '+' + diff +  ' secs'

        return result;
      }
    };

    let statuses = ['PLACED', 'SCHEDULED_FOR_MANUFACTURE', 'VIN_ASSIGNED', 'OWNER_ASSIGNED', 'DELIVERED'];

    let websocket;

    var openWebSocket = () => {
      var webSocketURL;
      if (this.config.useLocalWS) {
        webSocketURL = 'ws://' + location.host + '/ws/updateorderstatus';
      } else {
        webSocketURL = this.config.nodeRedBaseURL + '/ws/updateorderstatus';
      }
      console.log('connecting websocket', webSocketURL);
      websocket = new WebSocket(webSocketURL);

      websocket.onopen = function () {
        console.log('updateorderstatus websocket open!');
      };

      websocket.onclose = function() {
        console.log('closed updateorderstatus');
        openWebSocket();
      }

      websocket.onmessage = (event) => {
        if (event.data === '__pong__') {
          return;
        }

        var status = JSON.parse(event.data);

        if (status.order) {
          this.order = status.order;
        }

        if (status.orderStatus === statuses[0]) {
          this.stage[0] = status.timestamp;
        } else {
          let i = statuses.indexOf(status.orderStatus);
          this.stage[i] = this.relativeDate(status.timestamp, this.stage[0]);
        }
      };
    }

    var openInsureWebSocket = () => {
      let insureWebSocketURL;
      if (this.config.useLocalWS) {
        insureWebSocketURL = 'ws://' + location.host + '/ws/insurecar';
      } else {
        insureWebSocketURL = this.config.nodeRedBaseURL + '/ws/insurecar';
      }
      console.log('connecting websocket', insureWebSocketURL);
      this.insureWebsocket = new WebSocket(insureWebSocketURL);

      this.insureWebsocket.onopen = function () {
        console.log('insurecar websocket open!');
      };

      this.insureWebsocket.onclose = function() {
        console.log('closed insurecar');
        openInsureWebSocket();
      }
    }

    this.loadConfig()
      .then((config) => {
        this.config = config;
        openWebSocket();
        openInsureWebSocket();
      });
  }

  loadConfig(): Promise<any> {
      // Load the config data.
      return this.http.get('/assets/config.json')
      .map((res: Response) => res.json())
      .toPromise();
  }

  insure() {
    if (this.order) {
      this.insureWebsocket.send(JSON.stringify(this.order));
    }
  }
}
