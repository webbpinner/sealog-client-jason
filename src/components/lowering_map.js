import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import moment from 'moment';
import axios from 'axios';
import Cookies from 'universal-cookie';
import { Map, TileLayer, WMSTileLayer, Marker, Polyline, Popup, LayersControl, ScaleControl } from 'react-leaflet';
import L from 'leaflet';
import { Row, Col, Card, Tooltip, OverlayTrigger, Pagination, Dropdown, ListGroup } from 'react-bootstrap';
import 'rc-slider/assets/index.css';
import Slider, { createSliderWithTooltip } from 'rc-slider';
import EventShowDetailsModal from './event_show_details_modal';
import EventFilterForm from './event_filter_form';
import ImagePreviewModal from './image_preview_modal';
import EventCommentModal from './event_comment_modal';
import LoweringDropdown from './lowering_dropdown';
import LoweringModeDropdown from './lowering_mode_dropdown';
import * as actions from '../actions';
import { API_ROOT_URL, IMAGE_PATH } from '../client_config';
import tilelayers from '../map_tilelayers';

const { BaseLayer, Overlay } = LayersControl

const cookies = new Cookies();

let fileDownload = require('js-file-download');

const SliderWithTooltip = createSliderWithTooltip(Slider);

const maxEventsPerPage = 10;

class LoweringMap extends Component {

  constructor (props) {
    super(props);

    this.state = {
      fetching: false,
      tracklines: {},

      replayEventIndex: 0,
      activePage: 1,

      zoom: 13,
      center:{lat:41.522664576, lng:-70.657830702},
      position:{lat:41.522664576, lng:-70.657830702},
      showMarker: false,
      height: "480px"
    };

    // this.auxDatasourceFilters = ['vehicleRealtimeNavData', 'vehicleReNavData'];
    this.auxDatasourceFilters = ['vehicleRealtimeNavData'];

    this.sliderTooltipFormatter = this.sliderTooltipFormatter.bind(this);
    this.handleSliderChange = this.handleSliderChange.bind(this);
    this.handleEventClick = this.handleEventClick.bind(this);
    this.handlePageSelect = this.handlePageSelect.bind(this);
    this.updateEventFilter = this.updateEventFilter.bind(this);

    this.calcVehiclePosition = this.calcVehiclePosition.bind(this);
    this.handleLoweringSelect = this.handleLoweringSelect.bind(this);
    this.handleLoweringModeSelect = this.handleLoweringModeSelect.bind(this);
    this.handleMoveEnd = this.handleMoveEnd.bind(this);
    this.handleZoomEnd = this.handleZoomEnd.bind(this);
    this.initMapView = this.initMapView.bind(this);
    this.toggleASNAP = this.toggleASNAP.bind(this);
  }

  componentDidMount() {

    if(!this.props.lowering.id || this.props.lowering.id !== this.props.match.params.id || this.props.event.events.length === 0) {
      this.props.initLoweringReplay(this.props.match.params.id, this.props.event.hideASNAP);
    } else {
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

    this.initLoweringTrackline(this.props.match.params.id);
  }

  componentDidUpdate() {
    // this.calcVehiclePosition(this.props.event)
    this.map.leafletElement.invalidateSize();

    // if(this.props.height != this.state.height) {
    // console.log("height change from", this.state.height, "to", this.props.height)
    // this.setState({height: this.props.height})
    // }
  }

  componentWillUnmount(){}

  async initLoweringTrackline(id) {
    this.setState({ fetching: true});

    let tracklines = {

    };

    for (let index=0;index<this.auxDatasourceFilters.length;index++) {

    	tracklines[this.auxDatasourceFilters[index]] = {
    		eventIDs: [],
    		polyline: L.polyline([]),
    	};

      let url = `${API_ROOT_URL}/api/v1/event_aux_data/bylowering/${id}?datasource=${this.auxDatasourceFilters[index]}`;
      const data = await axios.get(url,
        {
          headers: {
            authorization: cookies.get('token')
          }
        }).then((response) => {
      	response.data.map((r_data) => {
      		tracklines[this.auxDatasourceFilters[index]].polyline.addLatLng([ parseFloat(r_data['data_array'].find(data => data['data_name'] == 'latitude')['data_value']), parseFloat(r_data['data_array'].find(data => data['data_name'] == 'longitude')['data_value'])]);
      		tracklines[this.auxDatasourceFilters[index]].eventIDs.push(r_data['event_id']);
      	});

      }).catch((error)=>{
	      if(error.response && error.response.data.statusCode === 404) {
	      }
	      else {
	      	console.log(error);
	      }

	    });
	  }

    this.setState({ tracklines: tracklines, fetching: false });
    this.initMapView();
  }

  initMapView() {
  	if(this.state.tracklines.vehicleReNavData && !this.state.tracklines.vehicleReNavData.polyline.isEmpty()) {
  		this.map.leafletElement.panTo(this.state.tracklines.vehicleReNavData.polyline.getBounds());
  		this.map.leafletElement.fitBounds(this.state.tracklines.vehicleReNavData.polyline.getBounds());
  	}
  	else if(this.state.tracklines.vehicleRealtimeNavData && !this.state.tracklines.vehicleRealtimeNavData.polyline.isEmpty()) {
  		this.map.leafletElement.panTo(this.state.tracklines.vehicleRealtimeNavData.polyline.getBounds().getCenter());
  		this.map.leafletElement.fitBounds(this.state.tracklines.vehicleRealtimeNavData.polyline.getBounds());
  	}
  }

  updateEventFilter(filter = {}) {
    this.setState({ activePage: 1, replayEventIndex: 0 });
    this.props.updateEventFilterForm(filter);
    this.props.eventUpdateLoweringReplay(this.props.match.params.id, this.props.event.hideASNAP);
  }

  toggleASNAP() {
  	this.props.eventUpdateLoweringReplay(this.props.match.params.id, !this.props.event.hideASNAP);
    if(this.props.event.hideASNAP) {
    	this.props.showASNAP();
    	this.handleEventClick(0);
    }
    else {
      this.props.hideASNAP();
    	this.setState({replayEventIndex: 0});
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
      this.setState({replayEventIndex: index});
      this.props.advanceLoweringReplayTo(this.props.event.events[index].id);
      this.setState({activePage: Math.ceil((index+1)/maxEventsPerPage)});
    }
  }

  handleEventClick(index) {
    this.setState({replayEventIndex: index});
    if(this.props.event.events[index]) {
	    this.props.advanceLoweringReplayTo(this.props.event.events[index].id);
	    this.setState({activePage: Math.ceil((index+1)/maxEventsPerPage)});
	  }
  }

  handleEventCommentModal(index) {
    this.setState({replayEventIndex: index});
    this.props.advanceLoweringReplayTo(this.props.event.events[index].id);
    this.props.showModal('eventComment', { event: this.props.event.events[index], handleUpdateEvent: this.props.updateEvent });
  }

  handlePageSelect(eventKey) {
    this.setState({activePage: eventKey, replayEventIndex: (eventKey-1)*maxEventsPerPage });
    this.props.advanceLoweringReplayTo(this.props.event.events[(eventKey-1)*maxEventsPerPage].id);
  }

  handleZoomEnd() {
  	if(this.map) {
  		// console.log("zoom end:", this.map.leafletElement.getZoom())
	    this.setState({zoom: this.map.leafletElement.getZoom()});
	  }
  }

  handleMoveEnd() {
  	if(this.map) {
  		// console.log("move end:", this.map.leafletElement.getCenter())
	  	this.setState({center: this.map.leafletElement.getCenter()});
	  }
  }

  calcVehiclePosition(selected_event) {
    if(selected_event && selected_event.aux_data) {
      let vehicleRealtimeNavData = selected_event.aux_data.find(aux_data => aux_data.data_source == "vehicleRealtimeNavData");
      if(vehicleRealtimeNavData) {
        let latObj = vehicleRealtimeNavData.data_array.find(data => data.data_name == "latitude");
        let lonObj = vehicleRealtimeNavData.data_array.find(data => data.data_name == "longitude");

        if(latObj && lonObj && latObj.data_value != this.state.position.lat && lonObj.data_value != this.state.position.lng) {
          this.setState({ showMarker: true, position:{ lat:latObj.data_value, lng: lonObj.data_value}});
        } else if(!latObj || !lonObj) {
          this.setState({showMarker: false});
        }
      }
    }
  }

  handleEventShowDetailsModal(index) {
    this.props.showModal('eventShowDetails', { event: this.props.event.events[index], handleUpdateEvent: this.props.updateEvent });
  }

  handleLoweringSelect(id) {
    this.props.gotoLoweringMap(id);
    this.props.initLoweringReplay(id);
    this.props.initCruiseFromLowering(id);
    this.initLoweringTrackline(id);
    // this.setState({replayEventIndex: 0, activePage: 1})
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

  renderControlsCard() {

    if(this.props.lowering) {
      const loweringStartTime = moment(this.props.lowering.start_ts);
      const loweringEndTime = moment(this.props.lowering.stop_ts);
      const loweringDuration = loweringEndTime.diff(loweringStartTime);
      
      return (
        <Card border="secondary" style={{marginBottom: "8px"}}>
          <Card.Body>
            <Row>
              <Col xs={4}>
                <span className="text-primary">00:00:00</span>
              </Col>
              <Col xs={{span:4, offset:4}}>
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

          let eventDetails = <OverlayTrigger placement="left" overlay={<Tooltip id={`commentTooltip_${event.id}`}>View Details</Tooltip>}><FontAwesomeIcon onClick={() => this.handleEventShowDetailsModal(index)} icon='window-maximize' fixedWidth/></OverlayTrigger>;

          //eventArray.push(<ListGroup.Item className="event-list-item" eventKey={event.id} key={event.id}><span onClick={() => this.handleEventShowDetailsModal(event)}>{event.ts} {`<${event.event_author}>`}: {event.event_value} {eventOptions}</span><span className="float-right">{commentTooltip}</span></ListGroup.Item>);
          return (<ListGroup.Item className="event-list-item" key={event.id} active={active} ><span onClick={() => this.handleEventClick(index)} >{`${event.ts} <${event.event_author}>: ${event.event_value} ${eventOptions}`}</span><span className="float-right">{eventDetails} {eventComment}</span></ListGroup.Item>);

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
        <Pagination>
          <Pagination.First onClick={() => this.handlePageSelect(1)} />
          <Pagination.Prev onClick={() => { if(this.state.activePage > 1) { this.handlePageSelect(this.state.activePage-1)}}} />
          {rangeWithDots}
          <Pagination.Next onClick={() => { if(this.state.activePage < last) { this.handlePageSelect(this.state.activePage+1)}}} />
          <Pagination.Last onClick={() => this.handlePageSelect(last)} />
        </Pagination>
      );
    }
  }

  renderMarker() {

  	if(this.props.event.selected_event.aux_data && typeof this.props.event.selected_event.aux_data.find((data) => data['data_source'] === 'vehicleRealtimeNavData') !== 'undefined') {

  		const realtimeNavData = this.props.event.selected_event.aux_data.find((data) => data['data_source'] === 'vehicleRealtimeNavData');
  		return (
	      <Marker position={[ parseFloat(realtimeNavData['data_array'].find(data => data['data_name'] == 'latitude')['data_value']), parseFloat(realtimeNavData['data_array'].find(data => data['data_name'] == 'longitude')['data_value'])]}>
	        <Popup>
	          You are here! :-)
	        </Popup>
	      </Marker>
	    );
  	}
  }

  render() {
    // Esri Ocean Layer
    // maxZoom={13}
    // <TileLayer
    //   attribution='Tiles &copy; Esri'
    //   url="https://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}"
    // />

    // OpenStreetMap
    // <TileLayer
    //   attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    //   url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    // />

    const baseLayers = tilelayers.map((layer, index) => {
      if(layer.wms) {
        return (
          <BaseLayer checked={layer.default} key={`baseLayer_${index}`} name={layer.name}>
            <WMSTileLayer
              attribution={layer.attribution}
              url={layer.url}
              layers={layer.layers}
              transparent={layer.transparent}
            />
          </BaseLayer>
        )
      }
      else {
        return (
          <BaseLayer checked={layer.default} key={`baseLayer_${index}`} name={layer.name}>
            <TileLayer
              attribution={layer.attribution}
              url={layer.url}
            />
          </BaseLayer>
        )
      }
    })

    const realtimeTrack = (this.state.tracklines.vehicleRealtimeNavData && !this.state.tracklines.vehicleRealtimeNavData.polyline.isEmpty()) ? 
    	<Polyline color="lime" positions={this.state.tracklines.vehicleRealtimeNavData.polyline.getLatLngs()} />
      : null;

    const reNavTrack = (this.state.tracklines.vehicleReNavData && !this.state.tracklines.vehicleReNavData.polyline.isEmpty()) ? 
    	<Polyline color="red" positions={this.state.tracklines.vehicleReNavData.polyline.getLatLngs()} />
      : null;

    const cruise_id = (this.props.cruise.cruise_id)? this.props.cruise.cruise_id : "Loading...";
    const lowering_id = (this.props.lowering.lowering_id)? this.props.lowering.lowering_id : "Loading...";
    return (
      <div>
      	<EventCommentModal />
      	<EventShowDetailsModal />
        <Row>
          <Col lg={12}>
            <span style={{paddingLeft: "8px"}}>
              <span onClick={() => this.props.gotoCruiseMenu()} className="text-warning">{cruise_id}</span>
              {' '}/{' '}
              <span><LoweringDropdown onClick={this.handleLoweringSelect} active_cruise={this.props.cruise} active_lowering={this.props.lowering}/></span>
              {' '}/{' '}
              <span><LoweringModeDropdown onClick={this.handleLoweringModeSelect} active_mode={"Map"} modes={["Replay", "Review", "Gallery"]}/></span>
            </span>
          </Col>
        </Row>
        <Row style={{paddingTop: "8px"}}>
          <Col sm={12}>
          	<Card border="secondary">
	          	<Card.Body className="data-card-body">
		            <Map
		              style={{ height: this.state.height }}
		              center={this.state.center}
		              zoom={this.state.zoom}
		              onMoveEnd={this.handleMoveEnd}
		              onZoomEnd={this.handleZoomEnd}
		              ref={ (map) => this.map = map}
		            >
                  <ScaleControl position="bottomleft" />
		              <LayersControl position="topright">
                    {baseLayers}
                  </LayersControl>
		              {realtimeTrack}
		              {reNavTrack}
		              {this.renderMarker()}
		            </Map>
		          </Card.Body>
		        </Card>
          </Col>
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
// maxZoom={10}

function mapStateToProps(state) {

  return {
    cruise: state.cruise.cruise,
    lowering: state.lowering.lowering,  
    roles: state.user.profile.roles,
    event: state.event
  };
}

export default connect(mapStateToProps, actions)(LoweringMap);
