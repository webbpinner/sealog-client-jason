import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';
import axios from 'axios';
import Cookies from 'universal-cookie';
import { Link } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';
import { connect } from 'react-redux';
import { Button, Row, Col, Grid, Panel, Accordion, Pagination, ListGroup, ListGroupItem, MenuItem, Thumbnail, Well, OverlayTrigger, Tooltip, ButtonToolbar, DropdownButton } from 'react-bootstrap';
import 'rc-slider/assets/index.css';
import Slider, { createSliderWithTooltip } from 'rc-slider';
import { Line } from 'rc-progress';
import EventFilterForm from './event_filter_form';
import ImagePreviewModal from './image_preview_modal';
import EventCommentModal from './event_comment_modal';
import * as actions from '../actions';
import { ROOT_PATH, API_ROOT_URL, IMAGE_PATH } from '../client_config';

let fileDownload = require('js-file-download');

const dateFormat = "YYYYMMDD"
const timeFormat = "HHmm"

const cookies = new Cookies();

const imagePanelStyle = {minHeight: "100px"}

const playTimer = 3000
const ffwdTimer = 1000

const PLAY = 0
const PAUSE = 1
const FFWD = 2
const FREV = 3

const maxEventsPerPage = 8;

// const SliderWithTooltip = createSliderWithTooltip(Slider);

class LoweringReplay extends Component {

  constructor (props) {
    super(props);

    this.state = {
      replayTimer: null,
      replayState: PAUSE,
      replayEventIndex: 0,
      hideASNAP: false,
      activePage: 1
    }

    this.sliderTooltipFormatter = this.sliderTooltipFormatter.bind(this);
    this.handleSliderChange = this.handleSliderChange.bind(this);
    this.handleEventClick = this.handleEventClick.bind(this);
    this.handlePageSelect = this.handlePageSelect.bind(this);
    this.replayAdvance = this.replayAdvance.bind(this);
    this.replayReverse = this.replayReverse.bind(this);
    this.updateEventFilter = this.updateEventFilter.bind(this)

  }

  componentWillMount() {
    this.props.initLoweringReplay(this.props.match.params.id, this.state.hideASNAP);
  }

  componentDidMount() {
  }

  componentDidUpdate() {
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
    this.props.eventUpdateLoweringReplay(this.props.match.params.id, this.state.hideASNAP)
  }

  toggleASNAP() {
    this.props.eventUpdateLoweringReplay(this.props.lowering.id, !this.state.hideASNAP)
    this.handleLoweringReplayPause();
    this.setState( prevState => ({hideASNAP: !prevState.hideASNAP, activePage: 1, replayEventIndex: 0}))
  }

  fetchEventAuxData() {

    const cookies = new Cookies();
    let startTS = (this.props.event.eventFilter.startTS)? `startTS=${this.props.event.eventFilter.startTS}` : ''
    let stopTS = (this.props.event.eventFilter.stopTS)? `&stopTS=${this.props.event.eventFilter.stopTS}` : ''
    let value = (this.props.event.eventFilter.value)? `&value=${this.props.event.eventFilter.value.split(',').join("&value=")}` : ''
    value = (this.state.hideASNAP)? `&value=!ASNAP${value}` : value;
    let author = (this.props.event.eventFilter.author)? `&author=${this.props.event.eventFilter.author.split(',').join("&author=")}` : ''
    let freetext = (this.props.event.eventFilter.freetext)? `&freetext=${this.props.event.eventFilter.freetext}` : ''
    let datasource = (this.props.event.eventFilter.datasource)? `&datasource=${this.props.event.eventFilter.datasource}` : ''

    return axios.get(`${API_ROOT_URL}/api/v1/event_aux_data/bylowering/${this.props.lowering.id}?${startTS}${stopTS}${value}${author}${freetext}${datasource}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }).then((response) => {
        console.log(response)
        return response.data
      }).catch((error)=>{
        if(error.response.data.statusCode == 404){
          return []
        } else {
          console.log(error.response);
          return []
        }
      }
    );
  }

  fetchEventsWithAuxData(format = 'json') {

    const cookies = new Cookies();
    // console.log("event export update")
    format = `format=${format}`
    let startTS = (this.props.event.eventFilter.startTS)? `&startTS=${this.props.event.eventFilter.startTS}` : ''
    let stopTS = (this.props.event.eventFilter.stopTS)? `&stopTS=${this.props.event.eventFilter.stopTS}` : ''
    let value = (this.props.event.eventFilter.value)? `&value=${this.props.event.eventFilter.value.split(',').join("&value=")}` : ''
    value = (this.state.hideASNAP)? `&value=!ASNAP${value}` : value;
    let author = (this.props.event.eventFilter.author)? `&author=${this.props.event.eventFilter.author.split(',').join("&author=")}` : ''
    let freetext = (this.props.event.eventFilter.freetext)? `&freetext=${this.props.event.eventFilter.freetext}` : ''
    let datasource = (this.props.event.eventFilter.datasource)? `&datasource=${this.props.event.eventFilter.datasource}` : ''

    return axios.get(`${API_ROOT_URL}/api/v1/event_exports/bylowering/${this.props.lowering.id}?${format}${startTS}${stopTS}${value}${author}${freetext}${datasource}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }).then((response) => {
        return response.data
      }).catch((error)=>{
        if(error.response.data.statusCode == 404){
          return []
        } else {
          console.log(error.response);
          return []
        }
      }
    );
  }

  fetchEvents(format = 'json') {

    const cookies = new Cookies();
    // console.log("event export update")
    format = `format=${format}`
    let startTS = (this.props.event.eventFilter.startTS)? `&startTS=${this.props.event.eventFilter.startTS}` : ''
    let stopTS = (this.props.event.eventFilter.stopTS)? `&stopTS=${this.props.event.eventFilter.stopTS}` : ''
    let value = (this.props.event.eventFilter.value)? `&value=${this.props.event.eventFilter.value.split(',').join("&value=")}` : ''
    value = (this.state.hideASNAP)? `&value=!ASNAP${value}` : value;
    let author = (this.props.event.eventFilter.author)? `&author=${this.props.event.eventFilter.author.split(',').join("&author=")}` : ''
    let freetext = (this.props.event.eventFilter.freetext)? `&freetext=${this.props.event.eventFilter.freetext}` : ''
    let datasource = (this.props.event.eventFilter.datasource)? `&datasource=${this.props.event.eventFilter.datasource}` : ''

    return axios.get(`${API_ROOT_URL}/api/v1/events/bylowering/${this.props.lowering.id}?${format}${startTS}${stopTS}${value}${author}${freetext}${datasource}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }).then((response) => {
        return response.data
      }).catch((error)=>{
        if(error.response.data.statusCode == 404){
          return []
        } else {
          console.log(error.response);
          return []
        }
      }
    );
  }

  exportEventsWithAuxDataToCSV() {
    this.fetchEventsWithAuxData('csv').then((results) => {
      let prefix = moment.utc(this.props.event.events[0].ts).format(dateFormat + "_" + timeFormat)
      fileDownload(results, `${prefix}.sealog_export.csv`);
    }).catch((error) => {
      console.log(error)
    })
  }

  exportEventsToCSV() {
    this.fetchEvents('csv').then((results) => {
      let prefix = moment.utc(this.props.event.events[0].ts).format(dateFormat + "_" + timeFormat)
      fileDownload(results, `${prefix}.sealog_eventExport.csv`);
    }).catch((error) => {
      console.log(error)
    })
  }

  exportEventsWithAuxDataToJSON() {

    this.fetchEventsWithAuxData().then((results) => {
      let prefix = moment.utc(this.props.event.events[0].ts).format(dateFormat + "_" + timeFormat)
      fileDownload(JSON.stringify(results, null, 2), `${prefix}.sealog_export.json`);
    }).catch((error) => {
      console.log(error)
    })
  }

  exportEventsToJSON() {

    this.fetchEvents().then((results) => {
      let prefix = moment.utc(this.props.event.events[0].ts).format(dateFormat + "_" + timeFormat)
      fileDownload(JSON.stringify(results, null, 2), `${prefix}.sealog_eventExport.json`);
    }).catch((error) => {
      console.log(error)
    })
  }

  exportAuxDataToJSON() {

    this.fetchEventAuxData().then((results) => {
      let prefix = moment.utc(this.props.event.events[0].ts).format(dateFormat + "_" + timeFormat)
      fileDownload(JSON.stringify(results, null, 2), `${prefix}.sealog_auxDataExport.json`);
    }).catch((error) => {
      console.log(error)
    })
  }

  sliderTooltipFormatter(v) {
    let loweringDuration = (this.props.event.events.length > 0)? this.props.event.events[v].ts : ''
    return `${loweringDuration}`;
  }

  handleSliderChange(index) {
    this.handleLoweringReplayPause();
    this.setState({replayEventIndex: index})
    this.props.advanceLoweringReplayTo(this.props.event.events[index].id)
    this.setState({activePage: Math.ceil((index+1)/maxEventsPerPage)})
  }

  handleEventClick(index) {
    this.handleLoweringReplayPause();
    this.setState({replayEventIndex: index})
    this.props.advanceLoweringReplayTo(this.props.event.events[index].id)
    this.setState({activePage: Math.ceil((index+1)/maxEventsPerPage)})
  }

  handleImageClick(source, filepath) {
    this.handleLoweringReplayPause()
    this.props.showModal('imagePreview', { name: source, filepath: filepath })
  }

  handleEventCommentModal(index) {
    this.handleLoweringReplayPause();
    this.setState({replayEventIndex: index})
    this.props.advanceLoweringReplayTo(this.props.event.events[index].id)
    this.props.showModal('eventComment', { event: this.props.event.events[index], handleUpdateEvent: this.props.updateEvent });
  }

  handlePageSelect(eventKey) {
    // console.log("eventKey:", eventKey)
    this.handleLoweringReplayPause();
    this.setState({activePage: eventKey, replayEventIndex: (eventKey-1)*maxEventsPerPage });
    this.props.advanceLoweringReplayTo(this.props.event.events[(eventKey-1)*maxEventsPerPage].id)
  }

  renderImage(source, filepath) {
    return (
      <Thumbnail onClick={ () => this.handleImageClick(source, filepath) } onError={this.handleMissingImage} src={filepath}>
        <div>{`Source: ${source}`}</div>
      </Thumbnail>
    )
  }

  handleMissingImage(ev) {
    ev.target.src = `${ROOT_PATH}images/noimage.jpeg`
  }

  handleLoweringReplayStart() {
    this.handleLoweringReplayPause();
    this.setState({replayEventIndex: 0})
    this.props.advanceLoweringReplayTo(this.props.event.events[this.state.replayEventIndex].id)
    this.setState({activePage: Math.ceil((this.state.replayEventIndex+1)/maxEventsPerPage)})
  }

  handleLoweringReplayEnd() {
    this.handleLoweringReplayPause();
    this.setState({replayEventIndex: this.props.event.events.length-1})
    this.props.advanceLoweringReplayTo(this.props.event.events[this.state.replayEventIndex].id)
    this.setState({activePage: Math.ceil((this.state.replayEventIndex+1)/maxEventsPerPage)})
  }

  handleLoweringReplayFRev() {
    this.setState({replayState: FREV})    
    if(this.state.replayTimer != null) {
      clearInterval(this.state.replayTimer);
    }
    this.setState({replayTimer: setInterval(this.replayReverse, ffwdTimer)})
  }

  handleLoweringReplayPlay() {
    this.setState({replayState: PLAY})
    if(this.state.replayTimer != null) {
      clearInterval(this.state.replayTimer);
    }
    this.setState({replayTimer: setInterval(this.replayAdvance, playTimer)})
  }

  handleLoweringReplayPause() {
    this.setState({replayState: PAUSE})
    if(this.state.replayTimer != null) {
      clearInterval(this.state.replayTimer);
    }
    this.setState({replayTimer: null})
  }

  handleLoweringReplayFFwd() {
    this.setState({replayState: FFWD})
    if(this.state.replayTimer != null) {
      clearInterval(this.state.replayTimer);
    }
    this.setState({replayTimer: setInterval(this.replayAdvance, ffwdTimer)})

  }

  replayAdvance() {
    if(this.state.replayEventIndex < (this.props.event.events.length - 1)) {
      this.setState({replayEventIndex: this.state.replayEventIndex + 1})
      this.props.advanceLoweringReplayTo(this.props.event.events[this.state.replayEventIndex].id)
      this.setState({activePage: Math.ceil((this.state.replayEventIndex+1)/maxEventsPerPage)})
    } else {
      this.setState({replayState: PAUSE})
    }
  }

  replayReverse() {
    if(this.state.replayEventIndex > 0) {
      this.setState({replayEventIndex: this.state.replayEventIndex - 1})
      this.props.advanceLoweringReplayTo(this.props.event.events[this.state.replayEventIndex].id)
      this.setState({activePage: Math.ceil((this.state.replayEventIndex+1)/maxEventsPerPage)})
    } else {
      this.setState({replayState: PAUSE})
    }
  }

  renderImageryPanel() {
    if(this.props.event && this.props.event.selected_event.aux_data) {

      if (this.props.event.selected_event.event_value == "SuliusCam") {
        let tmpData =[]

        for (let i = 0; i < this.props.event.selected_event.event_options.length; i++) {
          if (this.props.event.selected_event.event_options[i].event_option_name == "filename") {
            tmpData.push({source: "SuliusCam", filepath: API_ROOT_URL + IMAGE_PATH + '/SuliusCam/' + this.props.event.selected_event.event_options[i].event_option_value} )
          } 
        }

        return (
          <Row>
            {
              tmpData.map((camera) => {
                return (
                  <Col key={camera.source} xs={6} sm={3} md={3} lg={3}>
                    {this.renderImage(camera.source, camera.filepath)}
                  </Col>
                )
              })
            }
          </Row>
        )
      } else {
        let frameGrabberData = this.props.event.selected_event.aux_data.filter(aux_data => aux_data.data_source == 'framegrabber')
        let tmpData = []

        if(frameGrabberData.length > 0) {
          for (let i = 0; i < frameGrabberData[0].data_array.length; i+=2) {
      
            tmpData.push({source: frameGrabberData[0].data_array[i].data_value, filepath: API_ROOT_URL + IMAGE_PATH + '/' + frameGrabberData[0].data_array[i+1].data_value.split('/').pop()} )
          }

          return (
            <Row>
              {
                tmpData.map((camera) => {
                  return (
                    <Col key={camera.source} xs={6} sm={3} md={3} lg={3}>
                      {this.renderImage(camera.source, camera.filepath)}
                    </Col>
                  )
                })
              }
            </Row>
          )
        }
      }
    }
  }

  renderSciCamPanel() {
    if(this.props.event && this.props.event.selected_event.event_value == 'SCICAM') {

      let sciCamData = this.props.event.selected_event.event_options.filter(event_option => event_option.event_option_name == 'filepath')

      if(sciCamData.length > 0) {
        return (
          <Row>
            <Col key='sciCamImage' xs={6} sm={3} md={3} lg={3}>
              {this.renderImage("SciCAM", IMAGE_PATH + '/SCICAM_Images/' + sciCamData[0].event_option_value.split('/').pop())}
            </Col>
          </Row>
        )
      }
    }
  }

  renderNavLatLonPanel() {

    let latitude = 'n/a'
    let longitude = 'n/a'
    let depth = 'n/a'
    let altitude = 'n/a'

    if(this.props.event && this.props.event.selected_event.aux_data) {
      let vehicleRealtimeNavData = this.props.event.selected_event.aux_data.filter(aux_data => aux_data.data_source == "vehicleRealtimeNavData")
      if(vehicleRealtimeNavData.length > 0) {
        let latObj = vehicleRealtimeNavData[0].data_array.filter(data => data.data_name == "latitude")
        latitude = (latObj.length > 0)? `${latObj[0].data_value} ${latObj[0].data_uom}` : 'n/a'

        let lonObj = vehicleRealtimeNavData[0].data_array.filter(data => data.data_name == "longitude")
        longitude = (lonObj.length > 0)? `${lonObj[0].data_value} ${lonObj[0].data_uom}` : 'n/a'

        let depthObj = vehicleRealtimeNavData[0].data_array.filter(data => data.data_name == "depth")
        depth = (depthObj.length > 0)? `${depthObj[0].data_value} ${depthObj[0].data_uom}` : 'n/a'

        let altObj = vehicleRealtimeNavData[0].data_array.filter(data => data.data_name == "altitude")
        altitude = (altObj.length > 0)? `${altObj[0].data_value} ${altObj[0].data_uom}` : 'n/a'

      }
    }  

    return (
      <ListGroup>
        <ListGroupItem>Lat:<span className="pull-right">{`${latitude}`}</span></ListGroupItem>
        <ListGroupItem>Lng:<span className="pull-right">{`${longitude}`}</span></ListGroupItem>
        <ListGroupItem>Depth:<span className="pull-right">{`${depth}`}</span></ListGroupItem>
        <ListGroupItem>Alt:<span className="pull-right">{`${altitude}`}</span></ListGroupItem>
      </ListGroup>
    );
  }

  renderNavAlvCoordPanel() {

    let alvin_x = 'n/a'
    let alvin_y = 'n/a'
    let alvin_z = 'n/a'

    if(this.props.event && this.props.event.selected_event.aux_data) {
      let alvinRealtimeAlvinCoordData = this.props.event.selected_event.aux_data.filter(aux_data => aux_data.data_source == "vehicleRealtimeNavData")
      if(alvinRealtimeAlvinCoordData.length > 0) {
        let xObj = alvinRealtimeAlvinCoordData[0].data_array.filter(data => data.data_name == "alvin_x")
        alvin_x = (xObj.length > 0)? `${xObj[0].data_value} ${xObj[0].data_uom}` : 'n/a'

        let yObj = alvinRealtimeAlvinCoordData[0].data_array.filter(data => data.data_name == "alvin_y")
        alvin_y = (yObj.length > 0)? `${yObj[0].data_value} ${yObj[0].data_uom}` : 'n/a'

        let zObj = alvinRealtimeAlvinCoordData[0].data_array.filter(data => data.data_name == "alvin_z")
        alvin_z = (zObj.length > 0)? `${zObj[0].data_value} ${zObj[0].data_uom}` : 'n/a'

      }
    }

    return (
      <ListGroup>
        <ListGroupItem>X:<span className="pull-right">{`${alvin_x}`}</span></ListGroupItem>
        <ListGroupItem>Y:<span className="pull-right">{`${alvin_y}`}</span></ListGroupItem>
        <ListGroupItem>Z:<span className="pull-right">{`${alvin_z}`}</span></ListGroupItem>
      </ListGroup>
    );
  }

  renderAttitudePanel() {
    let hdg = 'n/a'
    let pitch = 'n/a'
    let roll = 'n/a'

    if(this.props.event && this.props.event.selected_event.aux_data) {
      let vehicleRealtimeNavData = this.props.event.selected_event.aux_data.filter(aux_data => aux_data.data_source == "vehicleRealtimeNavData")
      if(vehicleRealtimeNavData.length > 0) {
        let hdgObj = vehicleRealtimeNavData[0].data_array.filter(data => data.data_name == "heading")
        hdg = (hdgObj.length > 0)? `${hdgObj[0].data_value} ${hdgObj[0].data_uom}` : 'n/a'

        let pitchObj = vehicleRealtimeNavData[0].data_array.filter(data => data.data_name == "pitch")
        pitch = (pitchObj.length > 0)? `${pitchObj[0].data_value} ${pitchObj[0].data_uom}` : 'n/a'

        let rollObj = vehicleRealtimeNavData[0].data_array.filter(data => data.data_name == "roll")
        roll = (rollObj.length > 0)? `${rollObj[0].data_value} ${rollObj[0].data_uom}` : 'n/a'

      }
    }  

    return (
      <ListGroup>
        <ListGroupItem>Hdg:<span className="pull-right">{`${hdg}`}</span></ListGroupItem>
        <ListGroupItem>Pitch:<span className="pull-right">{`${pitch}`}</span></ListGroupItem>
        <ListGroupItem>Roll:<span className="pull-right">{`${roll}`}</span></ListGroupItem>
      </ListGroup>
    );
  }

  renderDataPanel() {
    let ctd_c = 'n/a'
    let ctd_t = 'n/a'
    let ctd_d = 'n/a'
    let temp_probe = 'n/a'

    if(this.props.event && this.props.event.selected_event.aux_data) {
      let vehicleCTDData = this.props.event.selected_event.aux_data.filter(aux_data => aux_data.data_source == "vehicleCTDData")
      if(vehicleCTDData.length > 0) {
        let ctd_cObj = vehicleCTDData[0].data_array.filter(data => data.data_name == "ctd_c")
        ctd_c = (ctd_cObj.length > 0)? `${ctd_cObj[0].data_value} ${ctd_cObj[0].data_uom}` : 'n/a'

        let ctd_tObj = vehicleCTDData[0].data_array.filter(data => data.data_name == "ctd_t")
        ctd_t = (ctd_tObj.length > 0)? `${ctd_tObj[0].data_value} ${ctd_tObj[0].data_uom}` : 'n/a'

        let ctd_dObj = vehicleCTDData[0].data_array.filter(data => data.data_name == "ctd_d")
        ctd_d = (ctd_dObj.length > 0)? `${ctd_dObj[0].data_value} ${ctd_dObj[0].data_uom}` : 'n/a'

      }

      let vehicleTempProbeData = this.props.event.selected_event.aux_data.filter(aux_data => aux_data.data_source == "vehicleTempProbeData")
      if(vehicleTempProbeData.length > 0) {
        let temp_probeObj = vehicleTempProbeData[0].data_array.filter(data => data.data_name == "ctd_c")
        temp_probe = (temp_probeObj.length > 0)? `${temp_probeObj[0].data_value} ${temp_probeObj[0].data_uom}` : 'n/a'
      }
    }  

    return (
      <ListGroup>
        <ListGroupItem>CTD C:<span className="pull-right">{`${ctd_c}`}</span></ListGroupItem>
        <ListGroupItem>CTD T:<span className="pull-right">{`${ctd_t}`}</span></ListGroupItem>
        <ListGroupItem>CTD D:<span className="pull-right">{`${ctd_d}`}</span></ListGroupItem>
        <ListGroupItem>Temp Probe:<span className="pull-right">{`${temp_probe}`}</span></ListGroupItem>
      </ListGroup>
    );
  }

  renderAuxDataPanel() {

    let return_aux_data = []
    if(this.props.event && this.props.event.selected_event.aux_data) {
      return this.props.event.selected_event.aux_data.map((aux_data, index) => {
        let return_data = aux_data.data_array.map((data, index) => {
          return (<div key={`${aux_data.data_source}_data_point_${index}`}><label>{data.data_name}:</label><span> {data.data_value} {data.data_uom}</span></div>)
        })
        return (
          <Col key={`${aux_data.data_source}`} xs={12} md={6}>
            <Panel>
              <label>{aux_data.data_source}:</label>
              <ul>
                {return_data}
                </ul>
            </Panel>
          </Col>
        )
      })
    }  

    return null
  }

  renderControlsPanel() {

    if(this.props.lowering) {
      let loweringStartTime = moment(this.props.lowering.start_ts)
      let loweringEndTime = moment(this.props.lowering.stop_ts)

      let replayOffset = (this.props.event.selected_event.ts)? moment(this.props.event.selected_event.ts).diff(loweringStartTime) : 0
      let loweringDuration = loweringEndTime.diff(loweringStartTime)
      
      let playPause = (this.state.replayState != 1)? <Link key={`pause_${this.props.lowering.id}`} to="#" onClick={ () => this.handleLoweringReplayPause() }><FontAwesomeIcon icon="pause"/>{' '}</Link> : <Link key={`play_${this.props.lowering.id}`} to="#" onClick={ () => this.handleLoweringReplayPlay() }><FontAwesomeIcon icon="play"/>{' '}</Link>;

      let buttons = (this.props.event.selected_event.ts && !this.props.event.fetching)? (
        <div className="text-center">
          <Link key={`start_${this.props.lowering.id}`} to="#" onClick={ () => this.handleLoweringReplayStart() }><FontAwesomeIcon icon="step-backward"/>{' '}</Link>
          <Link key={`frev_${this.props.lowering.id}`} to="#" onClick={ () => this.handleLoweringReplayFRev() }><FontAwesomeIcon icon="backward"/>{' '}</Link>
          {playPause}
          <Link key={`ffwd_${this.props.lowering.id}`} to="#" onClick={ () => this.handleLoweringReplayFFwd() }><FontAwesomeIcon icon="forward"/>{' '}</Link>
          <Link key={`end_${this.props.lowering.id}`} to="#" onClick={ () => this.handleLoweringReplayEnd() }><FontAwesomeIcon icon="step-forward"/>{' '}</Link>
        </div>
      ):(
        <div className="text-center">
          <FontAwesomeIcon icon="step-backward"/>{' '}
          <FontAwesomeIcon icon="backward"/>{' '}
          <FontAwesomeIcon icon="play"/>{' '}
          <FontAwesomeIcon icon="forward"/>{' '}
          <FontAwesomeIcon icon="step-forward"/>
        </div>
      )


//            tipFormatter={this.sliderTooltipFormatter}
      return (
        <Panel>
          <Panel.Body>
            <Slider
              tipProps={{ overlayClassName: 'foo' }}
              trackStyle={{ opacity: 0.5 }}
              railStyle={{ opacity: 0.5 }}
              onAfterChange={this.handleSliderChange}
              max={this.props.event.events.length-1}
            />
            <Row>
              <Col xs={4}>
                  00:00:00
              </Col>
              <Col xs={4}>
                  {buttons}
              </Col>
              <Col xs={4}>
                <div className="pull-right">
                  {moment.duration(loweringDuration).format("d [days] hh:mm:ss")}
                </div>
              </Col>
            </Row>
            <Line percent={(this.props.event.fetching)? 0 : 100 * replayOffset / loweringDuration} strokeWidth={"1"} />
          </Panel.Body>
        </Panel>
      );
    }
  }

  renderEventListHeader() {

    const Label = "Filtered Events"
    const exportTooltip = (<Tooltip id="deleteTooltip">Export these events</Tooltip>)
    const toggleASNAPTooltip = (<Tooltip id="toggleASNAPTooltip">Show/Hide ASNAP Events</Tooltip>)

    const ASNAPToggleIcon = (this.state.hideASNAP)? "Show ASNAP" : "Hide ASNAP"
    const ASNAPToggle = (<Button disabled={this.props.event.fetching} bsSize="xs" onClick={() => this.toggleASNAP()}>{ASNAPToggleIcon}</Button>)

    return (
      <div>
        { Label }
        <ButtonToolbar className="pull-right" >
          {ASNAPToggle}
          <DropdownButton disabled={this.props.event.fetching} bsSize="xs" key={1} title={<OverlayTrigger placement="top" overlay={exportTooltip}><FontAwesomeIcon icon='download' fixedWidth/></OverlayTrigger>} id="export-dropdown" pullRight>
            <MenuItem key="toJSONHeader" eventKey={1.1} header>JSON format</MenuItem>
            <MenuItem key="toJSONAll" eventKey={1.2} onClick={ () => this.exportEventsWithAuxDataToJSON()}>Events w/aux data</MenuItem>
            <MenuItem key="toJSONEvents" eventKey={1.3} onClick={ () => this.exportEventsToJSON()}>Events Only</MenuItem>
            <MenuItem key="toJSONAuxData" eventKey={1.4} onClick={ () => this.exportAuxDataToJSON()}>Aux Data Only</MenuItem>
            <MenuItem divider />
            <MenuItem key="toCSVHeader" eventKey={1.5} header>CSV format</MenuItem>
            <MenuItem key="toCSVAll" eventKey={1.6} onClick={ () => this.exportEventsWithAuxDataToCSV()}>Events w/aux data</MenuItem>
            <MenuItem key="toCSVEvents" eventKey={1.6} onClick={ () => this.exportEventsToCSV()}>Events Only</MenuItem>
          </DropdownButton>
        </ButtonToolbar>
      </div>
    );
  }

  renderEventPanel() {

    if (!this.props.event.events) {
      return (
        <Panel>
          <Panel.Heading>{ this.renderEventListHeader() }</Panel.Heading>
          <Panel.Body>Loading...</Panel.Body>
        </Panel>
      )
    }

    return (
      <Panel>
        <Panel.Heading>{ this.renderEventListHeader() }</Panel.Heading>
        <ListGroup>
          {this.renderEvents()}
        </ListGroup>
      </Panel>
    );
  }

  renderEvents() {

    if(this.props.event.events && this.props.event.events.length > 0){

      let eventList = this.props.event.events.map((event, index) => {
        if(index >= (this.state.activePage-1) * maxEventsPerPage && index < (this.state.activePage * maxEventsPerPage)) {
          
          let comment_exists = false;

          let eventOptionsArray = event.event_options.reduce((filtered, option) => {
            if(option.event_option_name == 'event_comment') {
              comment_exists = (option.event_option_value !== '')? true : false;
            } else {
              filtered.push(`${option.event_option_name}: \"${option.event_option_value}\"`);
            }
            return filtered
          },[])
          
          if (event.event_free_text) {
            eventOptionsArray.push(`free_text: \"${event.event_free_text}\"`)
          } 

          let active = (this.props.event.selected_event.id == event.id)? true : false

          let eventOptions = (eventOptionsArray.length > 0)? '--> ' + eventOptionsArray.join(', '): ''
          let commentIcon = (comment_exists)? <FontAwesomeIcon onClick={() => this.handleEventCommentModal(i)} icon='comment' fixedWidth transform="grow-4"/> : <span onClick={() => this.handleEventCommentModal(i)} className="fa-layers fa-fw"><FontAwesomeIcon icon='comment' fixedWidth transform="grow-4"/><FontAwesomeIcon icon='plus' fixedWidth inverse transform="shrink-4"/></span>
          let commentTooltip = (comment_exists)? (<OverlayTrigger placement="top" overlay={<Tooltip id={`commentTooltip_${event.id}`}>Edit/View Comment</Tooltip>}>{commentIcon}</OverlayTrigger>) : (<OverlayTrigger placement="top" overlay={<Tooltip id={`commentTooltip_${event.id}`}>Add Comment</Tooltip>}>{commentIcon}</OverlayTrigger>)

          // eventArray.push(<ListGroupItem key={event.id}><Row><Col xs={11} onClick={() => this.handleEventShowDetailsModal(event)}>{event.ts} {`<${event.event_author}>`}: {event.event_value} {eventOptions}</Col><Col>{deleteTooltip} {commentTooltip} {seatubeTooltip} {youtubeTooltip} </Col></Row></ListGroupItem>);
          return (<ListGroupItem key={event.id} active={active} ><Row><Col xs={11} ><span onClick={() => this.handleEventClick(index)} >{`${event.ts} <${event.event_author}>: ${event.event_value} ${eventOptions}`}</span></Col><Col>{commentTooltip}</Col></Row></ListGroupItem>);

        }
      });

      return evenList
    }

    return (<ListGroupItem>No events found</ListGroupItem>)
  }

  renderPagination() {

    if(!this.props.event.fetching && this.props.event.events.length > maxEventsPerPage) {
      let eventCount = this.props.event.events.length
      let last = Math.ceil(eventCount/maxEventsPerPage);
      let delta = 2
      let left = this.state.activePage - delta
      let right = this.state.activePage + delta + 1
      let range = []
      let rangeWithDots = []
      let l = null

      for (let i = 1; i <= last; i++) {
        if (i == 1 || i == last || i >= left && i < right) {
            range.push(i);
        }
      }

      for (let i of range) {
        if (l) {
          if (i - l === 2) {
            rangeWithDots.push(<Pagination.Item key={l + 1} active={(this.state.activePage === l+1)} onClick={() => this.setState({activePage: (l + 1)})}>{l + 1}</Pagination.Item>)
          } else if (i - l !== 1) {
            rangeWithDots.push(<Pagination.Ellipsis key={`ellipsis_${i}`} />);
          }
        }
        rangeWithDots.push(<Pagination.Item key={i} active={(this.state.activePage === i)} onClick={() => this.setState({activePage: i})}>{i}</Pagination.Item>);
        l = i;
      }

      return (
        <Pagination>
          <Pagination.First onClick={() => this.setState({activePage: 1})} />
          <Pagination.Prev onClick={() => { if(this.state.activePage > 1) { this.setState(prevState => ({ activePage: prevState.activePage-1}))}}} />
          {rangeWithDots}
          <Pagination.Next onClick={() => { if(this.state.activePage < last) { this.setState(prevState => ({ activePage: prevState.activePage+1}))}}} />
          <Pagination.Last onClick={() => this.setState({activePage: last})} />
        </Pagination>
      )
    }
  }

  // renderPopoutMapButton() {
  //   return (
  //     <Link to="#" onClick={ () => this.openMapWindow() }><Button disabled={this.props.event.fetching}>Open Map Window</Button></Link>
  //   )  
  // }

  // openMapWindow() {

  //   let url = `${ROOT_PATH}/replay_map/${this.props.lowering.id}`
  //   let strWindowFeatures = "menubar=no,toolbar=no,location=no,width=640,height=780,resizable=yes,scrollbars=yes,status=yes";
  //   let win = window.open(url, '_blank', strWindowFeatures);
  //   win.focus();
  // }

  render(){
    return (
      <div>
        <ImagePreviewModal />
        <EventCommentModal />
        <Row>
          <Col lg={12}>
            <div>
              <Well bsSize="small">
                {`Lowerings / ${this.props.lowering.lowering_id} / Replay`}{' '}
                <span className="pull-right">
                  <LinkContainer to={ `/lowering_review/${this.props.match.params.id}` }><Button disabled={this.props.event.fetching} bsSize={'xs'}>Goto Review</Button></LinkContainer>
                </span>
              </Well>
            </div>
          </Col>
        </Row>
        <Row>
          <Col sm={12}>
            {this.renderImageryPanel()}
          </Col>
        </Row>
        <Row>
          <Col sm={12}>
            {this.renderSciCamPanel()}
          </Col>
        </Row>
        <Row>
          <Col sm={4} md={3} lg={3}>
            {this.renderNavLatLonPanel()}
          </Col>
          <Col sm={4} md={3} lg={3}>
            {this.renderNavAlvCoordPanel()}
          </Col>
          <Col sm={4} md={3} lg={3}>
            {this.renderAttitudePanel()}
          </Col>
        </Row>
        <Row>
          <Col md={9} lg={9}>
            {this.renderControlsPanel()}
            {this.renderEventPanel()}
            {this.renderPagination()}
          </Col>          
          <Col md={3} lg={3}>
            <EventFilterForm disabled={this.props.event.fetching} hideASNAP={this.state.hideASNAP} handlePostSubmit={ this.updateEventFilter } minDate={this.props.lowering.start_ts} maxDate={this.props.lowering.stop_ts}/>
          </Col>          
        </Row>
      </div>
    )
  }
}


        // <Row>
          // <Col lg={12}>
            // {this.renderPopoutMapButton()}
          // </Col>
        // </Row>

function mapStateToProps(state) {
  return {
    lowering: state.lowering.lowering,  
    roles: state.user.profile.roles,
    event: state.event
  }
}

export default connect(mapStateToProps, null)(LoweringReplay);
