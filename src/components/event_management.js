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
import { ROOT_PATH, API_ROOT_URL } from '../url_config';

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
      events: null
    }

    this.handleEventUpdate = this.handleEventUpdate.bind(this);
    this.handleEventDelete = this.handleEventDelete.bind(this);
    this.handlePageSelect = this.handlePageSelect.bind(this);
  }

  componentWillMount(){
    if(!this.state.events){
      this.fetchEventsForDisplay()
    }
  }

  componentDidUpdate() {
  }

  componentWillUnmount() {
  }

  handlePageSelect(eventKey) {
    // console.log("eventKey:", eventKey)
    this.setState({activePage: eventKey});
  }

  handleEventCommentModal(event) {
    this.props.showModal('eventComment', { event: event, handleUpdateEvent: this.handleEventUpdate });
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

  handleEventShowDetails(id) {
    this.props.showModal('eventShowDetails', { id: id });
  }

  async fetchEventsForDisplay(format = 'json') {

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

    this.setState({fetching: true})

    await axios.get(`${API_ROOT_URL}/api/v1/events?${format}${startTS}${stopTS}${value}${author}${freetext}${datasource}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }).then((response) => {
        this.setState({fetching: false})
        this.setState({events: response.data})
      }).catch((error)=>{
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

  fetchEvents() {

    const cookies = new Cookies();
    let startTS = (this.props.event.eventFilter.startTS)? `startTS=${this.props.event.eventFilter.startTS}` : ''
    let stopTS = (this.props.event.eventFilter.stopTS)? `&stopTS=${this.props.event.eventFilter.stopTS}` : ''
    let value = (this.props.event.eventFilter.value)? `&value=${this.props.event.eventFilter.value.split(',').join("&value=")}` : ''
    value = (this.state.hideASNAP)? `&value=!ASNAP${value}` : value;
    let author = (this.props.event.eventFilter.author)? `&author=${this.props.event.eventFilter.author.split(',').join("&author=")}` : ''
    let freetext = (this.props.event.eventFilter.freetext)? `&freetext=${this.props.event.eventFilter.freetext}` : ''
    let datasource = (this.props.event.eventFilter.datasource)? `&datasource=${this.props.event.eventFilter.datasource}` : ''

    return axios.get(`${API_ROOT_URL}/api/v1/events?${startTS}${stopTS}${value}${author}${freetext}${datasource}`,
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

  fetchEventAuxData() {

    const cookies = new Cookies();
    let startTS = (this.props.event.eventFilter.startTS)? `startTS=${this.props.event.eventFilter.startTS}` : ''
    let stopTS = (this.props.event.eventFilter.stopTS)? `&stopTS=${this.props.event.eventFilter.stopTS}` : ''
    let value = (this.props.event.eventFilter.value)? `&value=${this.props.event.eventFilter.value.split(',').join("&value=")}` : ''
    value = (this.state.hideASNAP)? `&value=!ASNAP${value}` : value;
    let author = (this.props.event.eventFilter.author)? `&author=${this.props.event.eventFilter.author.split(',').join("&author=")}` : ''
    let freetext = (this.props.event.eventFilter.freetext)? `&freetext=${this.props.event.eventFilter.freetext}` : ''
    let datasource = (this.props.event.eventFilter.datasource)? `&datasource=${this.props.event.eventFilter.datasource}` : ''

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
    const exportTooltip = (<Tooltip id="deleteTooltip">Export these events</Tooltip>)
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

  renderEventPanel() {

    if(this.state.fetching) {
      return (
        <Panel>
        <Panel.Heading>{ this.renderEventListHeader() }</Panel.Heading>
        <ListGroup>
          <ListGroupItem>Loading...</ListGroupItem>
        </ListGroup>
        </Panel>
      )
    } else if(this.state.events && this.state.events.length > 0) {

      let eventList = (this.state.hideASNAP)? this.state.events.filter(event => (event.event_value != "ASNAP")) : this.state.events

      if(eventList.length == 0){
        return (
          <Panel>
            <Panel.Heading>{ this.renderEventListHeader() }</Panel.Heading>
            <Panel.Body>No events found!</Panel.Body>
          </Panel>
        )
      }

      // console.log(this.props.event.selected_event)

      return (          
        <Panel>
        <Panel.Heading>{ this.renderEventListHeader() }</Panel.Heading>
        <ListGroup>
          {
            eventList.map((event, index) => {
              if(index >= (this.state.activePage-1) * maxEventsPerPage && index < (this.state.activePage * maxEventsPerPage)) {
                let eventOptionsArray = [];
                let comment_exists = false;
                event.event_options.map((option) => {
                  if (option.event_option_name != 'event_comment') {
                    eventOptionsArray.push(option.event_option_name.replace(/\s+/g, "_") + ": \"" + option.event_option_value + "\"");
                  } else {
                    comment_exists = (option.event_option_value !== '')? true : false;
                  }
                })
                
                if (event.event_free_text) {
                  eventOptionsArray.push("text: \"" + event.event_free_text + "\"")
                }

                let comment_icon = (comment_exists)? <FontAwesomeIcon icon='comment' fixedWidth transform="grow-4"/> : <span className="fa-layers fa-fw"><FontAwesomeIcon icon='comment' fixedWidth transform="grow-4"/><FontAwesomeIcon icon='plus' fixedWidth inverse transform="shrink-4"/></span>

                let eventOptions = (eventOptionsArray.length > 0)? '--> ' + eventOptionsArray.join(', '): ''
                let deleteTooltip = (<Tooltip id={`deleteTooltip_${event.id}`}>Delete Event</Tooltip>)
                let commentTooltip = (comment_exists)? (<Tooltip id={`commentTooltip_${event.id}`}>Edit/View Comment</Tooltip>) : (<Tooltip id={`commentTooltip_${event.id}`}>Add Comment</Tooltip>)
                let eventDetailsTooltip = (<Tooltip id={`commentTooltip_${event.id}`}>View Event Details</Tooltip>)
                
                return (
                  <ListGroupItem key={event.id} ><span onClick={() => this.handleEventShowDetails(event.id)}>{`${event.ts} <${event.event_author}>: ${event.event_value} ${eventOptions}`}</span><span className="pull-right" onClick={() => this.handleEventCommentModal(event)}><OverlayTrigger placement="top" overlay={commentTooltip}>{comment_icon}</OverlayTrigger></span><span className="pull-right text-danger" onClick={() => this.handleEventDeleteModal(event)}><OverlayTrigger placement="top" overlay={deleteTooltip}><FontAwesomeIcon icon='trash' fixedWidth/></OverlayTrigger></span></ListGroupItem>
                )
              }
            })
          }
        </ListGroup>
        </Panel>
      );
    } else {
      return (
        <Panel>
        <Panel.Heading>{ this.renderEventListHeader() }</Panel.Heading>
          <ListGroup>
            <ListGroupItem>No events found!</ListGroupItem>
          </ListGroup>
        </Panel>
      )
    }
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

    return (
      <div>
        <EventCommentModal />
        <DeleteEventModal />
        <EventShowDetailsModal />
        <Row>
          <Col sm={7} md={8} lg={9}>
            {this.renderEventPanel()}
            {this.renderPagination()}
          </Col>
          <Col sm={5} md={4} lg={3}>
            <EventFilterForm disabled={this.state.fetching} hideASNAP={this.state.hideASNAP} handlePostSubmit={ () => { this.setState({ activePage: 1}); this.fetchEvents() } } lowering_id={null}/>
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
