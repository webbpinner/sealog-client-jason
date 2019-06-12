import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import path from 'path';
import moment from 'moment';
import axios from 'axios';
import Cookies from 'universal-cookie';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import { Button, Row, Col, Dropdown, Card, Accordion, Pagination, ListGroup, Container, Image, OverlayTrigger, Tooltip, ButtonToolbar, DropdownButton, Breadcrumb } from 'react-bootstrap';
import 'rc-slider/assets/index.css';
import Slider, { createSliderWithTooltip } from 'rc-slider';
import EventFilterForm from './event_filter_form';
import ImagePreviewModal from './image_preview_modal';
import EventCommentModal from './event_comment_modal';
import LoweringDropdown from './lowering_dropdown';
import LoweringModeDropdown from './lowering_mode_dropdown';
import * as actions from '../actions';
import { ROOT_PATH, API_ROOT_URL, IMAGE_PATH } from '../client_config';

let fileDownload = require('js-file-download');

const dateFormat = "YYYYMMDD";
const timeFormat = "HHmm";

const cookies = new Cookies();

const imageCardStyle = {minHeight: "100px"};

const playTimer = 3000;
const ffwdTimer = 1000;

const PLAY = 0;
const PAUSE = 1;
const FFWD = 2;
const FREV = 3;

const maxEventsPerPage = 10;

const excludeAuxDataSources = ['vehicleRealtimeCTDData', 'vehicleRealtimeMAGData', 'vehicleRealtimeNavData', 'vehicleRealtimeAlvinCoordData', 'vehicleReNavData', 'vehicleReNavAlvinCoordData', 'vehicleRealtimeFramegrabberData'];

const SliderWithTooltip = createSliderWithTooltip(Slider);

class LoweringReplay extends Component {

  constructor (props) {
    super(props);

    this.state = {
      replayTimer: null,
      replayState: PAUSE,
      replayEventIndex: 0,
      activePage: 1,
    };

    this.sliderTooltipFormatter = this.sliderTooltipFormatter.bind(this);
    this.handleSliderChange = this.handleSliderChange.bind(this);
    this.handleEventClick = this.handleEventClick.bind(this);
    this.handlePageSelect = this.handlePageSelect.bind(this);
    this.replayAdvance = this.replayAdvance.bind(this);
    this.handleLoweringReplayPause = this.handleLoweringReplayPause.bind(this);
    this.replayReverse = this.replayReverse.bind(this);
    this.updateEventFilter = this.updateEventFilter.bind(this);
    this.handleLoweringSelect = this.handleLoweringSelect.bind(this);
    this.handleLoweringModeSelect = this.handleLoweringModeSelect.bind(this);

  }

  componentDidMount() {

    if(!this.props.lowering.id || this.props.lowering.id !== this.props.match.params.id || this.props.event.events.length === 0) {
      // console.log("initLoweringReplay", this.props.match.params.id)
      this.props.initLoweringReplay(this.props.match.params.id, this.props.event.hideASNAP);
    }
    else {
      const eventIndex = this.props.event.events.findIndex((event) => event.id === this.props.event.selected_event.id);
      this.setState(
        {
          replayEventIndex: eventIndex,
          activePage: Math.ceil((eventIndex+1)/maxEventsPerPage)
        }
      );
    }

    // if(!this.props.cruise.id || this.props.lowering.id !== this.props.match.params.id){
    this.props.initCruiseFromLowering(this.props.match.params.id);
    // }
  }

  componentDidUpdate() {
    // if(this.state.mapHeight !== this.mapCard.clientHeight) {
    //   this.setState({mapHeight: this.mapCard.clientHeight });
    // }
  }

  componentWillUnmount(){
    if(this.state.replayTimer) {
      clearInterval(this.state.replayTimer);
    }
  }

  updateEventFilter(filter = {}) {
    this.setState({ activePage: 1, replayEventIndex: 0 });
    this.handleLoweringReplayPause();
    this.props.updateEventFilterForm(filter);
    this.props.eventUpdateLoweringReplay(this.props.match.params.id, this.props.event.hideASNAP);
  }

  toggleASNAP() {
    this.props.eventUpdateLoweringReplay(this.props.lowering.id, !this.props.event.hideASNAP);
    this.handleLoweringReplayPause();
    if(this.props.event.hideASNAP) {
      this.props.showASNAP();
      this.handleEventClick(0);
    }
    else {
      this.props.hideASNAP();
      this.handleEventClick(0);
    }
  }

  fetchEventAuxData() {

    const cookies = new Cookies();
    let startTS = (this.props.event.eventFilter.startTS)? `startTS=${this.props.event.eventFilter.startTS}` : '';
    let stopTS = (this.props.event.eventFilter.stopTS)? `&stopTS=${this.props.event.eventFilter.stopTS}` : '';
    let value = (this.props.event.eventFilter.value)? `&value=${this.props.event.eventFilter.value.split(',').join("&value=")}` : '';
    value = (this.props.event.hideASNAP)? `&value=!ASNAP${value}` : value;
    let author = (this.props.event.eventFilter.author)? `&author=${this.props.event.eventFilter.author.split(',').join("&author=")}` : '';
    let freetext = (this.props.event.eventFilter.freetext)? `&freetext=${this.props.event.eventFilter.freetext}` : '';
    let datasource = (this.props.event.eventFilter.datasource)? `&datasource=${this.props.event.eventFilter.datasource}` : '';

    return axios.get(`${API_ROOT_URL}/api/v1/event_aux_data/bylowering/${this.props.lowering.id}?${startTS}${stopTS}${value}${author}${freetext}${datasource}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }).then((response) => {
      // console.log(response)
      return response.data;
    }).catch((error)=>{
      if(error.response.data.statusCode === 404){
        return [];
      } else {
        console.log(error.response);
        return [];
      }
    }
    );
  }

  fetchEventsWithAuxData(format = 'json') {

    const cookies = new Cookies();
    // console.log("event export update")
    format = `format=${format}`;
    let startTS = (this.props.event.eventFilter.startTS)? `&startTS=${this.props.event.eventFilter.startTS}` : '';
    let stopTS = (this.props.event.eventFilter.stopTS)? `&stopTS=${this.props.event.eventFilter.stopTS}` : '';
    let value = (this.props.event.eventFilter.value)? `&value=${this.props.event.eventFilter.value.split(',').join("&value=")}` : '';
    value = (this.props.event.hideASNAP)? `&value=!ASNAP${value}` : value;
    let author = (this.props.event.eventFilter.author)? `&author=${this.props.event.eventFilter.author.split(',').join("&author=")}` : '';
    let freetext = (this.props.event.eventFilter.freetext)? `&freetext=${this.props.event.eventFilter.freetext}` : '';
    let datasource = (this.props.event.eventFilter.datasource)? `&datasource=${this.props.event.eventFilter.datasource}` : '';

    return axios.get(`${API_ROOT_URL}/api/v1/event_exports/bylowering/${this.props.lowering.id}?${format}${startTS}${stopTS}${value}${author}${freetext}${datasource}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }).then((response) => {
      return response.data;
    }).catch((error)=>{
      if(error.response.data.statusCode === 404){
        return [];
      } else {
        console.log(error.response);
        return [];
      }
    }
    );
  }

  fetchEvents(format = 'json') {

    const cookies = new Cookies();
    // console.log("event export update")
    format = `format=${format}`;
    let startTS = (this.props.event.eventFilter.startTS)? `&startTS=${this.props.event.eventFilter.startTS}` : '';
    let stopTS = (this.props.event.eventFilter.stopTS)? `&stopTS=${this.props.event.eventFilter.stopTS}` : '';
    let value = (this.props.event.eventFilter.value)? `&value=${this.props.event.eventFilter.value.split(',').join("&value=")}` : '';
    value = (this.props.event.hideASNAP)? `&value=!ASNAP${value}` : value;
    let author = (this.props.event.eventFilter.author)? `&author=${this.props.event.eventFilter.author.split(',').join("&author=")}` : '';
    let freetext = (this.props.event.eventFilter.freetext)? `&freetext=${this.props.event.eventFilter.freetext}` : '';
    let datasource = (this.props.event.eventFilter.datasource)? `&datasource=${this.props.event.eventFilter.datasource}` : '';

    return axios.get(`${API_ROOT_URL}/api/v1/events/bylowering/${this.props.lowering.id}?${format}${startTS}${stopTS}${value}${author}${freetext}${datasource}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }).then((response) => {
      return response.data;
    }).catch((error)=>{
      if(error.response.data.statusCode === 404){
        return [];
      } else {
        console.log(error.response);
        return [];
      }
    }
    );
  }

  exportEventsWithAuxDataToCSV() {
    this.fetchEventsWithAuxData('csv').then((results) => {
      let prefix = moment.utc(this.props.event.events[0].ts).format(dateFormat + "_" + timeFormat);
      fileDownload(results, `${prefix}.sealog_export.csv`);
    }).catch((error) => {
      console.log(error);
    });
  }

  exportEventsToCSV() {
    this.fetchEvents('csv').then((results) => {
      let prefix = moment.utc(this.props.event.events[0].ts).format(dateFormat + "_" + timeFormat);
      fileDownload(results, `${prefix}.sealog_eventExport.csv`);
    }).catch((error) => {
      console.log(error);
    });
  }

  exportEventsWithAuxDataToJSON() {

    this.fetchEventsWithAuxData().then((results) => {
      let prefix = moment.utc(this.props.event.events[0].ts).format(dateFormat + "_" + timeFormat);
      fileDownload(JSON.stringify(results, null, 2), `${prefix}.sealog_export.json`);
    }).catch((error) => {
      console.log(error);
    });
  }

  exportEventsToJSON() {

    this.fetchEvents().then((results) => {
      let prefix = moment.utc(this.props.event.events[0].ts).format(dateFormat + "_" + timeFormat);
      fileDownload(JSON.stringify(results, null, 2), `${prefix}.sealog_eventExport.json`);
    }).catch((error) => {
      console.log(error);
    });
  }

  exportAuxDataToJSON() {

    this.fetchEventAuxData().then((results) => {
      let prefix = moment.utc(this.props.event.events[0].ts).format(dateFormat + "_" + timeFormat);
      fileDownload(JSON.stringify(results, null, 2), `${prefix}.sealog_auxDataExport.json`);
    }).catch((error) => {
      console.log(error);
    });
  }

  sliderTooltipFormatter(v) {
    if(this.props.event.events.length > 0) {
      let loweringStartTime = moment(this.props.lowering.start_ts);
      let loweringNow = moment(this.props.event.events[v].ts);
      let loweringElapse = loweringNow.diff(loweringStartTime);
      return moment.duration(loweringElapse).format("d [days] hh:mm:ss");
    }

    return '';
  }

  handleSliderChange(index) {
    if(this.props.event.events[index]) {
      this.handleLoweringReplayPause();
      this.setState({replayEventIndex: index});
      this.props.advanceLoweringReplayTo(this.props.event.events[index].id);
      this.setState({activePage: Math.ceil((index+1)/maxEventsPerPage)});
    }
  }

  handleEventClick(index) {
    this.handleLoweringReplayPause();
    this.setState({replayEventIndex: index});
    if(this.props.event.events[index]) {
      this.props.advanceLoweringReplayTo(this.props.event.events[index].id);
      this.setState({activePage: Math.ceil((index+1)/maxEventsPerPage)});
    }
  }

  handleImageClick(source, filepath) {
    this.handleLoweringReplayPause();
    this.props.showModal('imagePreview', { name: source, filepath: filepath });
  }

  handleEventCommentModal(index) {
    this.handleLoweringReplayPause();
    this.setState({replayEventIndex: index});
    this.props.advanceLoweringReplayTo(this.props.event.events[index].id);
    this.props.showModal('eventComment', { event: this.props.event.events[index], handleUpdateEvent: this.props.updateEvent });
  }

  handlePageSelect(eventKey) {
    this.handleLoweringReplayPause();
    this.setState({activePage: eventKey, replayEventIndex: (eventKey-1)*maxEventsPerPage });
    this.props.advanceLoweringReplayTo(this.props.event.events[(eventKey-1)*maxEventsPerPage].id);
  }

  handleLoweringSelect(id) {
    this.props.gotoLoweringReplay(id);
    this.props.initLoweringReplay(id, this.props.event.hideASNAP);
    this.props.initCruiseFromLowering(id);
    this.setState({replayEventIndex: 0, activePage: 1});
  }

  handleLoweringModeSelect(mode) {
    if(mode === "Review") {
      this.props.gotoLoweringReview(this.props.match.params.id);
    } else if (mode === "Gallery") {
      this.props.gotoLoweringGallery(this.props.match.params.id);
    } else if (mode === "Map") {
      this.props.gotoLoweringMap(this.props.match.params.id);
    } else if (mode === "Replay") {
      this.props.gotoLoweringReplay(this.props.match.params.id);
    }
  }

  renderImage(source, filepath) {
    return (
      <Card border="secondary" id={`image_${source}`}>
        <Card.Body className="data-card-body">
          <Image  fluid onError={this.handleMissingImage} src={filepath} onClick={ () => this.handleImageClick(source, filepath)} />
          <div style={{marginTop: "5px"}}>{source}</div>
        </Card.Body>
      </Card>
    );
  }

  handleMissingImage(ev) {
    ev.target.src = `${ROOT_PATH}images/noimage.jpeg`;
  }

  handleLoweringReplayStart() {
    this.handleLoweringReplayPause();
    this.setState({replayEventIndex: 0});
    this.props.advanceLoweringReplayTo(this.props.event.events[this.state.replayEventIndex].id);
    this.setState({activePage: Math.ceil((this.state.replayEventIndex+1)/maxEventsPerPage)});
  }

  handleLoweringReplayEnd() {
    this.handleLoweringReplayPause();
    this.setState({replayEventIndex: this.props.event.events.length-1});
    this.props.advanceLoweringReplayTo(this.props.event.events[this.state.replayEventIndex].id);
    this.setState({activePage: Math.ceil((this.state.replayEventIndex+1)/maxEventsPerPage)});
  }

  handleLoweringReplayFRev() {
    this.setState({replayState: FREV});    
    if(this.state.replayTimer !== null) {
      clearInterval(this.state.replayTimer);
    }
    this.setState({replayTimer: setInterval(this.replayReverse, ffwdTimer)});
  }

  handleLoweringReplayPlay() {
    this.setState({replayState: PLAY});
    if(this.state.replayTimer !== null) {
      clearInterval(this.state.replayTimer);
    }
    this.setState({replayTimer: setInterval(this.replayAdvance, playTimer)});
  }

  handleLoweringReplayPause() {
    this.setState({replayState: PAUSE});
    if(this.state.replayTimer !== null) {
      clearInterval(this.state.replayTimer);
    }
    this.setState({replayTimer: null});
  }

  handleLoweringReplayFFwd() {
    this.setState({replayState: FFWD});
    if(this.state.replayTimer !== null) {
      clearInterval(this.state.replayTimer);
    }
    this.setState({replayTimer: setInterval(this.replayAdvance, ffwdTimer)});

  }

  replayAdvance() {
    if(this.state.replayEventIndex < (this.props.event.events.length - 1)) {
      this.setState({replayEventIndex: this.state.replayEventIndex + 1});
      this.props.advanceLoweringReplayTo(this.props.event.events[this.state.replayEventIndex].id);
      this.setState({activePage: Math.ceil((this.state.replayEventIndex+1)/maxEventsPerPage)});
    } else {
      this.setState({replayState: PAUSE});
    }
  }

  replayReverse() {
    if(this.state.replayEventIndex > 0) {
      this.setState({replayEventIndex: this.state.replayEventIndex - 1});
      this.props.advanceLoweringReplayTo(this.props.event.events[this.state.replayEventIndex].id);
      this.setState({activePage: Math.ceil((this.state.replayEventIndex+1)/maxEventsPerPage)});
    } else {
      this.setState({replayState: PAUSE});
    }
  }

  renderImageryCard() {
    if(this.props.event && this.props.event.selected_event.aux_data) { 
      if (this.props.event.selected_event.event_value === "SulisCam") {
        let tmpData =[];

        for (let i = 0; i < this.props.event.selected_event.event_options.length; i++) {
          if (this.props.event.selected_event.event_options[i].event_option_name === "filename") {
            tmpData.push({source: "SulisCam", filepath: API_ROOT_URL + IMAGE_PATH + "/SulisCam/" + this.props.event.selected_event.event_options[i].event_option_value} );
          } 
        }

        return (
          <Row>
            {
              tmpData.map((camera) => {
                return (
                  <Col key={camera.source} xs={12} sm={6} md={3} lg={3}>
                    {this.renderImage(camera.source, camera.filepath)}
                  </Col>
                );
              })
            }
          </Row>
        );
      } else {
        let frameGrabberData = this.props.event.selected_event.aux_data.filter(aux_data => aux_data.data_source === 'vehicleRealtimeFramegrabberData');
        let tmpData = [];

        if(frameGrabberData.length > 0) {
          for (let i = 0; i < frameGrabberData[0].data_array.length; i+=2) {
      
            tmpData.push({source: frameGrabberData[0].data_array[i].data_value, filepath: API_ROOT_URL + IMAGE_PATH + '/' + path.basename(frameGrabberData[0].data_array[i+1].data_value)} );
          }

          return (
            <Row>
              {
                tmpData.map((camera) => {
                  return (
                    <Col key={camera.source} xs={12} sm={6} md={3} lg={3}>
                      {this.renderImage(camera.source, camera.filepath)}
                    </Col>
                  );
                })
              }
            </Row>
          );
        }
      }
    }
  }

  renderNavLatLonCard() {

    let realtime_latitude = 'n/a';
    let realtime_longitude = 'n/a';

    let renav_latitude = 'n/a';
    let renav_longitude = 'n/a';

    let delta_latitude = 'n/a';
    let delta_longitude = 'n/a';

    if(this.props.event && this.props.event.selected_event.aux_data) {
      let vehicleRealtimeNavData = this.props.event.selected_event.aux_data.find(aux_data => aux_data.data_source === "vehicleRealtimeNavData");
      if(vehicleRealtimeNavData) {
        let xObj = vehicleRealtimeNavData.data_array.find(data => data.data_name === "latitude");
        realtime_latitude = (xObj)? `${xObj.data_value} ${xObj.data_uom}` : 'n/a';
        delta_latitude = (xObj)? `${parseFloat(xObj.data_value)}` : 'n/a';

        let yObj = vehicleRealtimeNavData.data_array.find(data => data.data_name === "longitude");
        realtime_longitude = (yObj)? `${yObj.data_value} ${yObj.data_uom}` : 'n/a';
        delta_longitude = (yObj)? `${parseFloat(yObj.data_value)}` : 'n/a';
      }
    }

    if(this.props.event && this.props.event.selected_event.aux_data) {
      let vehicleReNavData = this.props.event.selected_event.aux_data.find(aux_data => aux_data.data_source === "vehicleReNavData");
      if(vehicleReNavData) {
        let xObj = vehicleReNavData.data_array.find(data => data.data_name === "latitude");
        renav_latitude = (xObj)? `${parseFloat(xObj.data_value).toFixed(6)} ${xObj.data_uom}` : 'n/a';
        delta_latitude = (xObj)? `${(delta_latitude - parseFloat(xObj.data_value)).toFixed(6)} ddeg` : 'n/a';

        let yObj = vehicleReNavData.data_array.find(data => data.data_name === "longitude");
        renav_longitude = (yObj)? `${parseFloat(yObj.data_value).toFixed(6)} ${yObj.data_uom}` : 'n/a';
        delta_longitude = (yObj)? `${(delta_longitude - parseFloat(yObj.data_value)).toFixed(6)} ddeg` : 'n/a';
      } else {
        delta_latitude = 'n/a';
        delta_longitude = 'n/a';
      }
    }


    return (
      <Card border="secondary">
        <Card.Header className="data-card-header">Lat/Lng Coordinates</Card.Header>
        <Card.Body className="data-card-body">
          <strong>Realtime</strong><br/>
          <div style={{paddingLeft: "10px"}}>
            Lat:<span className="float-right"> {`${realtime_latitude}`}</span><br/>
            Lng:<span className="float-right"> {`${realtime_longitude}`}</span><br/>
          </div>
          <strong>ReNav</strong><br/>
          <div style={{paddingLeft: "10px"}}>
            Lat:<span className="float-right"> {`${renav_latitude}`}</span><br/>
            Lng:<span className="float-right"> {`${renav_longitude}`}</span><br/>
          </div>
          <strong>Delta</strong><br/>
          <div style={{paddingLeft: "10px"}}>
            Lat:<span className="float-right"> {`${delta_latitude}`}</span><br/>
            Lng:<span className="float-right"> {`${delta_longitude}`}</span><br/>
          </div>
        </Card.Body>
      </Card>
    );
  }

  renderNavAlvCoordCard() {

    let realtime_alvin_x = 'n/a';
    let realtime_alvin_y = 'n/a';

    let renav_alvin_x = 'n/a';
    let renav_alvin_y = 'n/a';

    let delta_alvin_x = 'n/a';
    let delta_alvin_y = 'n/a';

    if(this.props.event && this.props.event.selected_event.aux_data) {
      let vehicleRealtimeAlvinCoordData = this.props.event.selected_event.aux_data.find(aux_data => aux_data.data_source === "vehicleRealtimeAlvinCoordData");
      if(vehicleRealtimeAlvinCoordData) {
        let xObj = vehicleRealtimeAlvinCoordData.data_array.find(data => data.data_name === "alvin_x");
        realtime_alvin_x = (xObj)? `${xObj.data_value} ${xObj.data_uom}` : 'n/a';
        delta_alvin_x = (xObj)? `${parseFloat(xObj.data_value)}` : 'n/a';

        let yObj = vehicleRealtimeAlvinCoordData.data_array.find(data => data.data_name === "alvin_y");
        realtime_alvin_y = (yObj)? `${yObj.data_value} ${yObj.data_uom}` : 'n/a';
        delta_alvin_y = (yObj)? `${parseFloat(yObj.data_value)}` : 'n/a';
      }
    }

    if(this.props.event && this.props.event.selected_event.aux_data) {
      let vehicleReNavAlvinCoordData = this.props.event.selected_event.aux_data.find(aux_data => aux_data.data_source === "vehicleReNavAlvinCoordData");
      if(vehicleReNavAlvinCoordData) {
        let xObj = vehicleReNavAlvinCoordData.data_array.find(data => data.data_name === "alvin_x");
        renav_alvin_x = (xObj)? `${parseFloat(xObj.data_value).toFixed(2)} ${xObj.data_uom}` : 'n/a';
        delta_alvin_x = (xObj)? `${(delta_alvin_x - parseFloat(xObj.data_value)).toFixed(2)} meters` : 'n/a';

        let yObj = vehicleReNavAlvinCoordData.data_array.find(data => data.data_name === "alvin_y");
        renav_alvin_y = (yObj)? `${parseFloat(yObj.data_value).toFixed(2)} ${yObj.data_uom}` : 'n/a';
        delta_alvin_y = (yObj)? `${(delta_alvin_y - parseFloat(yObj.data_value)).toFixed(2)} meters` : 'n/a';
      } else {
        delta_alvin_x = 'n/a';
        delta_alvin_y = 'n/a';
      }
    }

    return (
      <Card border="secondary">
        <Card.Header className="data-card-header">Alvin Coordinates</Card.Header>
        <Card.Body className="data-card-body">
          <strong>Realtime</strong><br/>
          <div style={{paddingLeft: "10px"}}>
            X:<span className="float-right"> {`${realtime_alvin_x}`}</span><br/>
            Y:<span className="float-right"> {`${realtime_alvin_y}`}</span><br/>
          </div>
          <strong>ReNav</strong><br/>
          <div style={{paddingLeft: "10px"}}>
            X:<span className="float-right"> {`${renav_alvin_x}`}</span><br/>
            Y:<span className="float-right"> {`${renav_alvin_y}`}</span><br/>
          </div>
          <strong>Delta</strong><br/>
          <div style={{paddingLeft: "10px"}}>
            X:<span className="float-right"> {`${delta_alvin_x}`}</span><br/>
            Y:<span className="float-right"> {`${delta_alvin_y}`}</span><br/>
          </div>
        </Card.Body>
      </Card>
    );
  }

  renderAttitudeCard() {
    let depth = 'n/a';
    let alt = 'n/a';
    let hdg = 'n/a';
    let pitch = 'n/a';
    let roll = 'n/a';

    if(this.props.event && this.props.event.selected_event.aux_data) {
      let vehicleRealtimeNavData = this.props.event.selected_event.aux_data.find(aux_data => aux_data.data_source === "vehicleRealtimeNavData");
      if(vehicleRealtimeNavData) {
        let depthObj = vehicleRealtimeNavData.data_array.find(data => data.data_name === "depth");
        depth = (depthObj)? `${depthObj.data_value} ${depthObj.data_uom}` : 'n/a';

        let altObj = vehicleRealtimeNavData.data_array.find(data => data.data_name === "altitude");
        alt = (altObj)? `${altObj.data_value} ${altObj.data_uom}` : 'n/a';

        let hdgObj = vehicleRealtimeNavData.data_array.find(data => data.data_name === "heading");
        hdg = (hdgObj)? `${hdgObj.data_value} ${hdgObj.data_uom}` : 'n/a';

        let pitchObj = vehicleRealtimeNavData.data_array.find(data => data.data_name === "pitch");
        pitch = (pitchObj)? `${pitchObj.data_value} ${pitchObj.data_uom}` : 'n/a';

        let rollObj = vehicleRealtimeNavData.data_array.find(data => data.data_name === "roll");
        roll = (rollObj)? `${rollObj.data_value} ${rollObj.data_uom}` : 'n/a';

      }
    }  

    return (
      <Card border="secondary">
        <Card.Header className="data-card-header">Vehicle Attitude</Card.Header>
        <Card.Body className="data-card-body">
          <strong>Realtime</strong><br/>
          <div style={{paddingLeft: "10px"}}>
            Depth:<span className="float-right"> {`${depth}`}</span><br/>
            Alt:<span className="float-right"> {`${alt}`}</span><br/>
            Hdg:<span className="float-right"> {`${hdg}`}</span><br/>
            Pitch:<span className="float-right"> {`${pitch}`}</span><br/>
            Roll:<span className="float-right"> {`${roll}`}</span><br/>
          </div>
        </Card.Body>
      </Card>
    );
  }

  renderSensorCard() {
    let ctd_data = null;
    let temp_probe_data = null;
    let mag_data = null;

    if(this.props.event && this.props.event.selected_event.aux_data) {
      const vehicleCTDData = this.props.event.selected_event.aux_data.find(aux_data => aux_data.data_source === "vehicleRealtimeCTDData");
      if(vehicleCTDData) {
        const ctd_cObj = vehicleCTDData.data_array.find(data => data.data_name === "ctd_c");
        const ctd_c = (ctd_cObj)? `${ctd_cObj.data_value} ${ctd_cObj.data_uom}` : 'n/a';

        const ctd_tObj = vehicleCTDData.data_array.find(data => data.data_name === "ctd_t");
        const ctd_t = (ctd_tObj)? `${ctd_tObj.data_value} ${ctd_tObj.data_uom}` : 'n/a';

        const ctd_dObj = vehicleCTDData.data_array.find(data => data.data_name === "ctd_d");
        const ctd_d = (ctd_dObj)? `${ctd_dObj.data_value} ${ctd_dObj.data_uom}` : 'n/a';

        ctd_data = (
          <Col sm={12} md={12}>
            <strong>CTD</strong><br/>
            <div style={{paddingLeft: "10px"}}>
              C:<span className="float-right"> {`${ctd_c}`}</span><br/>
              T:<span className="float-right"> {`${ctd_t}`}</span><br/>
              D:<span className="float-right"> {`${ctd_d}`}</span><br/>
            </div>
          </Col>
        );
      }

      const vehicleTempProbeData = this.props.event.selected_event.aux_data.find(aux_data => aux_data.data_source === "vehicleRealtimeTempProbeData");
      if(vehicleTempProbeData) {
        const temp_probeObj = vehicleTempProbeData.data_array.find(data => data.data_name === "ctd_c");
        const temp_probe = (temp_probeObj)? `${temp_probeObj.data_value} ${temp_probeObj.data_uom}` : 'n/a';

        temp_probe_data = (
          <Col sm={12} md={12}>
            <strong>Temp Probe</strong><br/>
            <div style={{paddingLeft: "10px"}}>
              Temp:<span className="float-right"> {`${temp_probe}`}</span><br/>
            </div>
          </Col>
        );
      }

      const vehicleMagData = this.props.event.selected_event.aux_data.find(aux_data => aux_data.data_source === "vehicleRealtimeMAGData");
      if(vehicleMagData) {
        const mag_xObj = vehicleMagData.data_array.find(data => data.data_name === "x-axis");
        const mag_x = (mag_xObj)? `${mag_xObj.data_value} ${mag_xObj.data_uom}` : 'n/a';

        const mag_yObj = vehicleMagData.data_array.find(data => data.data_name === "y-axis");
        const mag_y = (mag_yObj)? `${mag_yObj.data_value} ${mag_yObj.data_uom}` : 'n/a';

        const mag_zObj = vehicleMagData.data_array.find(data => data.data_name === "z-axis");
        const mag_z = (mag_zObj)? `${mag_zObj.data_value} ${mag_zObj.data_uom}` : 'n/a';

        mag_data = (
          <Col sm={12} md={12}>
            <strong>Magnetometer</strong><br/>
            <div style={{paddingLeft: "10px"}}>
              X:<span className="float-right"> {`${mag_x}`}</span><br/>
              Y:<span className="float-right"> {`${mag_y}`}</span><br/>
              Z:<span className="float-right"> {`${mag_z}`}</span><br/>
            </div>
          </Col>
        );
      }
    }

    return (ctd_data || temp_probe_data || mag_data)? (
      <Col xs={12} sm={6} md={6} lg={3}>
        <Card border="secondary">
          <Card.Header className="data-card-header">Sensor Data</Card.Header>
          <Card.Body className="data-card-body">
            <Row>
              {ctd_data}
              {temp_probe_data}
              {mag_data}
            </Row>
          </Card.Body>
        </Card>
      </Col>
    ):null;
  }

  renderEventOptionsCard() {

    if(this.props.event.selected_event && this.props.event.selected_event.event_options && this.props.event.selected_event.event_options.length > 0) {

      let event_seatube_permalink = false;

      let return_event_options = this.props.event.selected_event.event_options.reduce((filtered, event_option, index) => {
        if(event_option.event_option_name !== 'event_comment') {
          if (this.props.event.selected_event.event_value === "EDU" && event_option.event_option_name === 'seatube_permalink') {
            event_seatube_permalink = true;
            if(this.props.roles.includes("admin") || this.props.roles.includes("event_manager") || this.props.roles.includes("event_loggerr")) {
              if( event_option.event_option_value !== '') {
                filtered.push(<span key={`event_option_${index}`}>{event_option.event_option_name}: <a target="_blank" href={this.props.event.selected_event.event_options[index].event_option_value}>{this.props.event.selected_event.event_options[index].event_option_value}</a> (<span className="text-primary" onClick={() => this.handleEventPermalinkModal()}>Edit</span>)<br/></span>);
              }
              else {
                filtered.push(<span key={`event_option_${index}`}>{event_option.event_option_name}: (<span className="text-primary" onClick={() => this.handleEventPermalinkModal()}>Add</span>)<br/></span>);
              }
            }
          }
          else {
            filtered.push(<div key={`event_option_${index}`}><span>{event_option.event_option_name}:</span> <span style={{wordWrap:'break-word'}} >{event_option.event_option_value}</span><br/></div>);
          }
        }

        return filtered;
      },[]);

      if(this.props.event.selected_event.event_value === "EDU" && !event_seatube_permalink) {
        if(this.props.roles.includes("admin") || this.props.roles.includes("event_manager") || this.props.roles.includes("event_loggerr")) {
          return_event_options.push(<span key={`event_option_${return_event_options.length}`}>seatube_permalink: (<span className="text-primary" onClick={() => this.handleEventPermalinkModal()}>Add</span>)<br/></span>);
        }
        else {
          return_event_options.push(<span key={`event_option_${return_event_options.length}`}>seatube_permalink:<br/></span>); 
        }
      }

      return (return_event_options.length > 0)? (
        <Col xs={12} sm={6} md={6} lg={3}>
          <Card border="secondary">
            <Card.Header className="data-card-header">Event Options</Card.Header>
            <Card.Body className="data-card-body">
              <div style={{paddingLeft: "10px"}}>
                {return_event_options}
              </div>
            </Card.Body>
          </Card>
        </Col>
      ) : null;
    }
  }

  renderAuxDataCard() {

    if(this.props.event.selected_event && this.props.event.selected_event.aux_data) {
      let return_aux_data = this.props.event.selected_event.aux_data.reduce((filtered, aux_data, index) => {
        if(!excludeAuxDataSources.includes(aux_data.data_source)) {
          let aux_data_points = aux_data.data_array.map((data, index) => {
            return(<div key={`${aux_data.data_source}_data_point_${index}`}><span>{data.data_name}:</span> <span style={{wordWrap:'break-word'}} >{data.data_value} {data.data_uom}</span><br/></div>);
          });

          if(aux_data_points.length > 0) {
            filtered.push(
              <Col key={`${aux_data.data_source}_col`}sm={4} md={3} lg={3}>
                <Card key={`${aux_data.data_source}`} border="secondary">
                  <Card.Header className="data-card-header">{aux_data.data_source}</Card.Header>
                  <Card.Body className="data-card-body">
                    <div style={{paddingLeft: "10px"}}>
                      {aux_data_points}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          }
        }

        return filtered;
      },[]);

      return return_aux_data;
    }

    return null;
  }

  renderControlsCard() {

    if(this.props.lowering) {
      const loweringStartTime = moment(this.props.lowering.start_ts);
      const loweringEndTime = moment(this.props.lowering.stop_ts);
      const loweringDuration = loweringEndTime.diff(loweringStartTime);
      
      const playPause = (this.state.replayState !== 1)? <FontAwesomeIcon className="text-primary" key={`pause_${this.props.lowering.id}`} onClick={ () => this.handleLoweringReplayPause() } icon="pause"/> : <FontAwesomeIcon className="text-primary" key={`play_${this.props.lowering.id}`} onClick={ () => this.handleLoweringReplayPlay() } icon="play"/>;

      const buttons = (this.props.event.selected_event.ts && !this.props.event.fetching)? (
        <div className="text-center">
          <FontAwesomeIcon className="text-primary" key={`start_${this.props.lowering.id}`} onClick={ () => this.handleLoweringReplayStart() } icon="step-backward"/>{' '}
          <FontAwesomeIcon className="text-primary" key={`frev_${this.props.lowering.id}`} onClick={ () => this.handleLoweringReplayFRev() } icon="backward"/>{' '}
          {playPause}{' '}
          <FontAwesomeIcon className="text-primary" key={`ffwd_${this.props.lowering.id}`} onClick={ () => this.handleLoweringReplayFFwd() } icon="forward"/>{' '}
          <FontAwesomeIcon className="text-primary" key={`end_${this.props.lowering.id}`} onClick={ () => this.handleLoweringReplayEnd() } icon="step-forward"/>
        </div>
      ):(
        <div className="text-center">
          <FontAwesomeIcon icon="step-backward"/>{' '}
          <FontAwesomeIcon icon="backward"/>{' '}
          <FontAwesomeIcon icon="play"/>{' '}
          <FontAwesomeIcon icon="forward"/>{' '}
          <FontAwesomeIcon icon="step-forward"/>
        </div>
      );

      return (
        <Card border="secondary" style={{marginBottom: "8px"}}>
          <Card.Body>
            <Row>
              <Col xs={4}>
                <span className="text-primary">00:00:00</span>
              </Col>
              <Col xs={4}>
                {buttons}
              </Col>
              <Col xs={4}>
                <div className="float-right">
                  <span className="text-primary">{moment.duration(loweringDuration).format("d [days] hh:mm:ss")}</span>
                </div>
              </Col>
            </Row>
            <SliderWithTooltip
              value={this.state.replayEventIndex}
              tipFormatter={this.sliderTooltipFormatter}
              trackStyle={{ opacity: 0.5 }}
              railStyle={{ opacity: 0.5 }}
              onBeforeChange={this.handleLoweringReplayPause}
              onChange={this.handleSliderChange}
              max={this.props.event.events.length-1}
            />
          </Card.Body>
        </Card>
      );
    }
  }

  renderEventListHeader() {

    const Label = "Filtered Events";
    const exportTooltip = (<Tooltip id="deleteTooltip">Export these events</Tooltip>);
    const toggleASNAPTooltip = (<Tooltip id="toggleASNAPTooltip">Show/Hide ASNAP Events</Tooltip>);

    const ASNAPToggleIcon = (this.props.event.hideASNAP)? "Show ASNAP" : "Hide ASNAP";
    const ASNAPToggle = (<span disabled={this.props.event.fetching} style={{ marginRight: "10px" }} onClick={() => this.toggleASNAP()}>{ASNAPToggleIcon}</span>);

    return (
      <div>
        { Label }
        <span className="float-right">
          {ASNAPToggle}
          <Dropdown as={'span'} disabled={this.props.event.fetching} id="dropdown-download">
            <Dropdown.Toggle as={'span'}><OverlayTrigger placement="top" overlay={exportTooltip}><FontAwesomeIcon icon='download' fixedWidth/></OverlayTrigger></Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Header className="text-warning" key="toJSONHeader">JSON format</Dropdown.Header>
              <Dropdown.Item key="toJSONAll" onClick={ () => this.exportEventsWithAuxDataToJSON()}>Events w/aux data</Dropdown.Item>
              <Dropdown.Item key="toJSONEvents" onClick={ () => this.exportEventsToJSON()}>Events Only</Dropdown.Item>
              <Dropdown.Item key="toJSONAuxData" onClick={ () => this.exportAuxDataToJSON()}>Aux Data Only</Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Header className="text-warning" key="toCSVHeader">CSV format</Dropdown.Header>
              <Dropdown.Item key="toCSVAll" onClick={ () => this.exportEventsWithAuxDataToCSV()}>Events w/aux data</Dropdown.Item>
              <Dropdown.Item key="toCSVEvents" onClick={ () => this.exportEventsToCSV()}>Events Only</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </span>
      </div>
    );
  }

  renderEventCard() {
    return (
      <Card border="secondary">
        <Card.Header>{ this.renderEventListHeader() }</Card.Header>
        <ListGroup>
          {this.renderEvents()}
        </ListGroup>
      </Card>
    );
  }

  renderEvents() {

    if(this.props.event.events && this.props.event.events.length > 0){

      let eventList = this.props.event.events.map((event, index) => {
        if(index >= (this.state.activePage-1) * maxEventsPerPage && index < (this.state.activePage * maxEventsPerPage)) {
          
          let comment_exists = false;

          let eventOptionsArray = event.event_options.reduce((filtered, option) => {
            if(option.event_option_name === 'event_comment') {
              comment_exists = (option.event_option_value !== '')? true : false;
            } else {
              filtered.push(`${option.event_option_name}: \"${option.event_option_value}\"`);
            }
            return filtered;
          },[]);
          
          if (event.event_free_text) {
            eventOptionsArray.push(`free_text: \"${event.event_free_text}\"`);
          } 

          let active = (this.props.event.selected_event.id === event.id)? true : false;

          let eventOptions = (eventOptionsArray.length > 0)? '--> ' + eventOptionsArray.join(', '): '';
          
          let commentIcon = (comment_exists)? <FontAwesomeIcon onClick={() => this.handleEventCommentModal(index)} icon='comment' fixedWidth transform="grow-4"/> : <span onClick={() => this.handleEventCommentModal(index)} className="fa-layers fa-fw"><FontAwesomeIcon icon='comment' fixedWidth transform="grow-4"/><FontAwesomeIcon className={(active)? "text-primary" : "text-secondary" } icon='plus' fixedWidth transform="shrink-4"/></span>;
          let commentTooltip = (comment_exists)? (<OverlayTrigger placement="left" overlay={<Tooltip id={`commentTooltip_${event.id}`}>Edit/View Comment</Tooltip>}>{commentIcon}</OverlayTrigger>) : (<OverlayTrigger placement="top" overlay={<Tooltip id={`commentTooltip_${event.id}`}>Add Comment</Tooltip>}>{commentIcon}</OverlayTrigger>);
          let eventComment = (this.props.roles.includes("event_logger") || this.props.roles.includes("admin"))? commentTooltip : null;

          //eventArray.push(<ListGroup.Item className="event-list-item" eventKey={event.id} key={event.id}><span onClick={() => this.handleEventShowDetailsModal(event)}>{event.ts} {`<${event.event_author}>`}: {event.event_value} {eventOptions}</span><span className="float-right">{commentTooltip}</span></ListGroup.Item>);
          return (<ListGroup.Item className="event-list-item" key={event.id} active={active} ><span onClick={() => this.handleEventClick(index)} >{`${event.ts} <${event.event_author}>: ${event.event_value} ${eventOptions}`}</span><span className="float-right">{eventComment}</span></ListGroup.Item>);

        }
      });

      return eventList;
    }

    return (this.props.event.fetching)? (<ListGroup.Item className="event-list-item">Loading...</ListGroup.Item>) : (<ListGroup.Item>No events found</ListGroup.Item>);
  }

  renderPagination() {

    if(!this.props.event.fetching && this.props.event.events.length > maxEventsPerPage) {
      let eventCount = this.props.event.events.length;
      let last = Math.ceil(eventCount/maxEventsPerPage);
      let delta = 2;
      let left = this.state.activePage - delta;
      let right = this.state.activePage + delta + 1;
      let range = [];
      let rangeWithDots = [];
      let l = null;

      for (let i = 1; i <= last; i++) {
        if (i === 1 || i === last || i >= left && i < right) {
          range.push(i);
        }
      }

      for (let i of range) {
        if (l) {
          if (i - l === 2) {
            rangeWithDots.push(<Pagination.Item key={l + 1} active={(this.state.activePage === l+1)} onClick={() => this.handlePageSelect(l + 1)}>{l + 1}</Pagination.Item>);
          } else if (i - l !== 1) {
            rangeWithDots.push(<Pagination.Ellipsis key={`ellipsis_${i}`} />);
          }
        }
        rangeWithDots.push(<Pagination.Item key={i} active={(this.state.activePage === i)} onClick={() => this.handlePageSelect(i)}>{i}</Pagination.Item>);
        l = i;
      }

      return (
        <Pagination style={{marginTop: "8px"}}>
          <Pagination.First onClick={() => this.handlePageSelect(1)} />
          <Pagination.Prev onClick={() => { if(this.state.activePage > 1) { this.handlePageSelect(this.state.activePage-1);}}} />
          {rangeWithDots}
          <Pagination.Next onClick={() => { if(this.state.activePage < last) { this.handlePageSelect(this.state.activePage+1);}}} />
          <Pagination.Last onClick={() => this.handlePageSelect(last)} />
        </Pagination>
      );
    }
  }

  // renderMapCard() {

  //   // const mapRatio = (new Date(this.props.cruise.start_ts) <= new Date("2012-10-01"))? "embed-responsive-4by3" : "embed-responsive-16by9"
  //   const mapRatio = "embed-responsive-4by3"

  //   return (
  //     <Card border="secondary" id="MapCard" style={{backgroundColor: "#282828"}}>
  //       <Card.Body style={{padding: "4px", marginBottom: "10px"}}>
  //         <div ref={ (mapCard) => this.mapCard = mapCard} className={`embed-responsive ${mapRatio}`}>
  //           <LoweringReplayMap height={this.state.mapHeight} event={this.props.event.selected_event}/>
  //         </div>
  //         <div style={{marginTop: "8px", marginLeft: "10px"}}>Map</div>
  //       </Card.Body>
  //     </Card>
  //   )
  // }

  render(){

    const cruise_id = (this.props.cruise.cruise_id)? this.props.cruise.cruise_id : "Loading...";
    const lowering_id = (this.props.lowering.lowering_id)? this.props.lowering.lowering_id : "Loading...";

    return (
      <div>
        <ImagePreviewModal />
        <EventCommentModal />
        <Row>
          <Col lg={12}>
            <span style={{paddingLeft: "8px"}}>
              <span onClick={() => this.props.gotoCruiseMenu()} className="text-warning">{cruise_id}</span>
              {' '}/{' '}
              <span><LoweringDropdown onClick={this.handleLoweringSelect} active_cruise={this.props.cruise} active_lowering={this.props.lowering}/></span>
              {' '}/{' '}
              <span><LoweringModeDropdown onClick={this.handleLoweringModeSelect} active_mode={"Replay"} modes={["Review", "Map", "Gallery"]}/></span>
            </span>
          </Col>
        </Row>
        <Row style={{paddingTop: "8px"}}>
          <Col sm={12}>
            {this.renderImageryCard()}
          </Col>
        </Row>
        <Row style={{paddingTop: "8px"}}>
          <Col sm={4} md={3} lg={3}>
            {this.renderNavLatLonCard()}
          </Col>
          <Col sm={4} md={3} lg={3}>
            {this.renderNavAlvCoordCard()}
          </Col>
          <Col sm={4} md={3} lg={3}>
            {this.renderAttitudeCard()}
          </Col>
          {this.renderSensorCard()}
          {this.renderEventOptionsCard()}
          {this.renderAuxDataCard()}
        </Row>
        <Row style={{paddingTop: "8px"}}>
          <Col md={9} lg={9}>
            {this.renderControlsCard()}
            {this.renderEventCard()}
            {this.renderPagination()}
          </Col>          
          <Col md={3} lg={3}>
            <EventFilterForm disabled={this.props.event.fetching} hideASNAP={this.props.event.hideASNAP} handlePostSubmit={ this.updateEventFilter } minDate={this.props.lowering.start_ts} maxDate={this.props.lowering.stop_ts} initialValues={this.props.event.eventFilter}/>
          </Col>          
        </Row>
      </div>
    );
  }
}

function mapStateToProps(state) {

  return {
    cruise: state.cruise.cruise,
    lowering: state.lowering.lowering,  
    roles: state.user.profile.roles,
    event: state.event
  };
}

export default connect(mapStateToProps, null)(LoweringReplay);
