import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Link } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';
import moment from 'moment';
import { connect } from 'react-redux';
import Cookies from 'universal-cookie';
import { Button, Row, Col, Panel, ListGroup, ListGroupItem, ButtonToolbar, DropdownButton, Pagination, MenuItem, Tooltip, OverlayTrigger, Well } from 'react-bootstrap';
import axios from 'axios';
import EventFilterForm from './event_filter_form';
import EventCommentModal from './event_comment_modal';
import DeleteEventModal from './delete_event_modal';
import EventShowDetailsModal from './event_show_details_modal';
import * as actions from '../actions';
import { ROOT_PATH, API_ROOT_URL } from '../client_config';

let fileDownload = require('js-file-download');

const dateFormat = "YYYYMMDD"
const timeFormat = "HHmm"

const maxEventsPerPage = 15

class EventManagement extends Component {

  constructor (props) {
    super(props);

    this.state = {
      hideASNAP: true,
      activePage: 1,
      fetching: false,
      events: null,
      eventFilter: {},
    }

    this.handleEventUpdate = this.handleEventUpdate.bind(this);
    this.handleEventDelete = this.handleEventDelete.bind(this);
    this.handlePageSelect = this.handlePageSelect.bind(this);
    this.updateEventFilter = this.updateEventFilter.bind(this);
  }

  componentWillMount(){
    if(!this.state.events){
      this.fetchEventsForDisplay()
    }
  }

  handlePageSelect(eventKey) {
    this.setState({activePage: eventKey});
  }

  handleEventCommentModal(event) {
    this.props.showModal('eventComment', { event: event, handleUpdateEvent: this.handleEventUpdate });
  }

  updateEventFilter(filter = {}) {
    this.setState({ activePage: 1, eventFilter: filter });
    this.fetchEventsForDisplay(filter);
  }

  async handleEventUpdate(event_id, event_value, event_free_text, event_options, event_ts) {
    const response = await this.props.updateEvent(event_id, event_value, event_free_text, event_options, event_ts)
    if(response.response.status == 204) {
      this.setState(prevState => ({events: prevState.events.map((event) => {
          if(event.id === event_id) {
            event.event_options = event_options;
          }
          return event;
        })
      }))
    }
  }

  handleEventDeleteModal(event) {
    this.props.showModal('deleteEvent', { id: event.id, handleDelete: this.handleEventDelete });
  }

  async handleEventDelete(id) {
    const response = await this.props.deleteEvent(id)
    if(response.response.status == 204) {
      this.setState({events: this.state.events.filter(event => event.id != id)})
      if((this.state.events.length % maxEventsPerPage) === 0 && (this.state.events.length / maxEventsPerPage) === (this.state.activePage-1) ) {
        this.setState( prevState => ({activePage: prevState.activePage-1}))
      }
    }
  }

  handleEventShowDetailsModal(event) {
    this.props.showModal('eventShowDetails', { event: event, handleUpdateEvent: this.handleEventUpdate });
  }

  async fetchEventsForDisplay(eventFilter = this.state.eventFilter) {

    this.setState({fetching: true})

    const cookies = new Cookies();
    let startTS = (eventFilter.startTS)? `&startTS=${eventFilter.startTS}` : ''
    let stopTS = (eventFilter.stopTS)? `&stopTS=${eventFilter.stopTS}` : ''
    let value = (eventFilter.value)? `&value=${eventFilter.value.split(',').join("&value=")}` : ''
    value = (this.state.hideASNAP)? `&value=!ASNAP${value}` : value;
    let author = (eventFilter.author)? `&author=${eventFilter.author.split(',').join("&author=")}` : ''
    let freetext = (eventFilter.freetext)? `&freetext=${eventFilter.freetext}` : ''
    let datasource = (eventFilter.datasource)? `&datasource=${eventFilter.datasource}` : ''

    await axios.get(`${API_ROOT_URL}/api/v1/events?${startTS}${stopTS}${value}${author}${freetext}${datasource}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }).then((response) => {
        this.setState({fetching: false})
        this.setState({events: response.data})
      }).catch((error)=>{
        console.log(error)

        console.log("?? 1")
        if(error.response.data.statusCode == 404){
          this.setState({fetching: false})
          this.setState({events: []})
        } else {
          console.log(error.response);
          this.setState({fetching: false})
          this.setState({events: []})
        }
      }
    );
  }

  fetchEvents(format = 'json', eventFilter = this.state.eventFilter) {

    const cookies = new Cookies();
    format = `format=${format}`
    let startTS = (eventFilter.startTS)? `&startTS=${eventFilter.startTS}` : ''
    let stopTS = (eventFilter.stopTS)? `&stopTS=${eventFilter.stopTS}` : ''
    let value = (eventFilter.value)? `&value=${eventFilter.value.split(',').join("&value=")}` : ''
    value = (this.state.hideASNAP)? `&value=!ASNAP${value}` : value;
    let author = (eventFilter.author)? `&author=${eventFilter.author.split(',').join("&author=")}` : ''
    let freetext = (eventFilter.freetext)? `&freetext=${eventFilter.freetext}` : ''
    let datasource = (eventFilter.datasource)? `&datasource=${eventFilter.datasource}` : ''

    return axios.get(`${API_ROOT_URL}/api/v1/events?${format}${startTS}${stopTS}${value}${author}${freetext}${datasource}`,
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

  fetchEventAuxData(eventFilter = this.state.eventFilter) {

    const cookies = new Cookies();
    let startTS = (eventFilter.startTS)? `startTS=${eventFilter.startTS}` : ''
    let stopTS = (eventFilter.stopTS)? `&stopTS=${eventFilter.stopTS}` : ''
    let value = (eventFilter.value)? `&value=${eventFilter.value.split(',').join("&value=")}` : ''
    value = (this.state.hideASNAP)? `&value=!ASNAP${value}` : value;
    let author = (eventFilter.author)? `&author=${eventFilter.author.split(',').join("&author=")}` : ''
    let freetext = (eventFilter.freetext)? `&freetext=${eventFilter.freetext}` : ''
    let datasource = (eventFilter.datasource)? `&datasource=${eventFilter.datasource}` : ''

    return axios.get(`${API_ROOT_URL}/api/v1/event_aux_data?${startTS}${stopTS}${value}${author}${freetext}${datasource}`,
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

  fetchEventsWithAuxData(format = 'json', eventFilter = this.state.eventFilter) {

    const cookies = new Cookies();
    format = `format=${format}`
    let startTS = (eventFilter.startTS)? `&startTS=${eventFilter.startTS}` : ''
    let stopTS = (eventFilter.stopTS)? `&stopTS=${eventFilter.stopTS}` : ''
    let value = (eventFilter.value)? `&value=${eventFilter.value.split(',').join("&value=")}` : ''
    value = (this.state.hideASNAP)? `&value=!ASNAP${value}` : value;
    let author = (eventFilter.author)? `&author=${eventFilter.author.split(',').join("&author=")}` : ''
    let freetext = (eventFilter.freetext)? `&freetext=${eventFilter.freetext}` : ''
    let datasource = (eventFilter.datasource)? `&datasource=${eventFilter.datasource}` : ''

    return axios.get(`${API_ROOT_URL}/api/v1/event_exports/?${format}${startTS}${stopTS}${value}${author}${freetext}${datasource}`,
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
      let prefix = moment.utc(this.state.events[0].ts).format(dateFormat + "_" + timeFormat)
      fileDownload(results, `${prefix}.sealog_export.csv`);
    }).catch((error) => {
      console.log(error)
    })
  }

  exportEventsToCSV() {
    this.fetchEvents('csv').then((results) => {
      let prefix = moment.utc(this.state.events[0].ts).format(dateFormat + "_" + timeFormat)
      fileDownload(results, `${prefix}.sealog_eventExport.csv`);
    }).catch((error) => {
      console.log(error)
    })
  }

  exportEventsWithAuxDataToJSON() {
    this.fetchEventsWithAuxData().then((results) => {
      let prefix = moment.utc(this.state.events[0].ts).format(dateFormat + "_" + timeFormat)
      fileDownload(JSON.stringify(results, null, 2), `${prefix}.sealog_export.json`);
    }).catch((error) => {
      console.log(error)
    })
  }

  exportEventsToJSON() {

    this.fetchEvents().then((results) => {
      let prefix = moment.utc(this.state.events[0].ts).format(dateFormat + "_" + timeFormat)
      fileDownload(JSON.stringify(results, null, 2), `${prefix}.sealog_eventExport.json`);
    }).catch((error) => {
      console.log(error)
    })
  }

  exportAuxDataToJSON() {

    this.fetchEventAuxData().then((results) => {
      let prefix = moment.utc(this.state.events[0].ts).format(dateFormat + "_" + timeFormat)
      fileDownload(JSON.stringify(results, null, 2), `${prefix}.sealog_auxDataExport.json`);
    }).catch((error) => {
      console.log(error)
    })
  }

  toggleASNAP() {
    this.setState( prevState => ({hideASNAP: !prevState.hideASNAP, activePage: 1}))
  }

  renderEventListHeader() {

    const Label = "Filtered Events"
    const exportTooltip = (<Tooltip id="exportTooltip">Export these events</Tooltip>)
    const toggleASNAPTooltip = (<Tooltip id="toggleASNAPTooltip">Show/Hide ASNAP Events</Tooltip>)

    const ASNAPToggleIcon = (this.state.hideASNAP)? "Show ASNAP" : "Hide ASNAP"
    const ASNAPToggle = (<Button disabled={this.state.fetching} bsSize="xs" onClick={() => this.toggleASNAP()}>{ASNAPToggleIcon}</Button>)

    return (
      <div>
        { Label }
        <ButtonToolbar className="pull-right" >
          {ASNAPToggle}
          <DropdownButton disabled={this.state.fetching} bsSize="xs" key={1} title={<OverlayTrigger placement="top" overlay={exportTooltip}><FontAwesomeIcon icon='download' fixedWidth/></OverlayTrigger>} id="export-dropdown" pullRight>
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

  renderEvents() {

    if(this.state.events && this.state.events.length > 0){

      let eventArray = []

      for (let i = (this.state.activePage-1) * maxEventsPerPage; i < this.state.activePage * maxEventsPerPage; i++) {

        if(i >= this.state.events.length)
          break

        let event = this.state.events[i]
        
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

        let eventOptions = (eventOptionsArray.length > 0)? '--> ' + eventOptionsArray.join(', '): ''
        let commentIcon = (comment_exists)? <FontAwesomeIcon onClick={() => this.handleEventCommentModal(event)} icon='comment' fixedWidth transform="grow-4"/> : <span onClick={() => this.handleEventCommentModal(event)} className="fa-layers fa-fw"><FontAwesomeIcon icon='comment' fixedWidth transform="grow-4"/><FontAwesomeIcon icon='plus' fixedWidth inverse transform="shrink-4"/></span>
        let commentTooltip = (comment_exists)? (<OverlayTrigger placement="top" overlay={<Tooltip id={`commentTooltip_${event.id}`}>Edit/View Comment</Tooltip>}>{commentIcon}</OverlayTrigger>) : (<OverlayTrigger placement="top" overlay={<Tooltip id={`commentTooltip_${event.id}`}>Add Comment</Tooltip>}>{commentIcon}</OverlayTrigger>)

        let deleteIcon = <FontAwesomeIcon className={"text-danger"} onClick={() => this.handleEventDeleteModal(event)} icon='trash' fixedWidth/>
        let deleteTooltip = (<OverlayTrigger placement="top" overlay={<Tooltip id={`deleteTooltip_${event.id}`}>Delete this event</Tooltip>}>{deleteIcon}</OverlayTrigger>)

        eventArray.push(<ListGroupItem key={event.id}><Row><Col xs={11} onClick={() => this.handleEventShowDetailsModal(event)}>{event.ts} {`<${event.event_author}>`}: {event.event_value} {eventOptions}</Col><Col>{deleteTooltip} {commentTooltip}</Col></Row></ListGroupItem>);
      }
      return eventArray
    }

    return (<ListGroupItem>No events found</ListGroupItem>)
  }

  renderEventPanel() {

    if (!this.state.events) {
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

  renderPagination() {

    if(!this.state.fetching && this.state.events && this.state.events.length > maxEventsPerPage) {
      let eventCount = this.state.events.length
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

  render(){

    // console.log(this.props.event.eventFilter)

    return (
      <div>
        <EventCommentModal />
        <DeleteEventModal />
        <EventShowDetailsModal />
        <Row>
          <Col sm={7} md={8} lg={8}>
            {this.renderEventPanel()}
            {this.renderPagination()}
          </Col>
          <Col sm={5} md={4} lg={4}>
            <EventFilterForm disabled={this.state.fetching} hideASNAP={this.state.hideASNAP} handlePostSubmit={ this.updateEventFilter } lowering_id={null}/>
          </Col>
        </Row>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    roles: state.user.profile.roles,
    event: state.event,
  }
}

export default connect(mapStateToProps, null)(EventManagement);
