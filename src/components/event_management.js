import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Link } from 'react-router-dom';
import moment from 'moment';
import { connect } from 'react-redux';
import Cookies from 'universal-cookie';
import { Button, Row, Col, Card, ListGroup, ButtonToolbar, Dropdown, Pagination, MenuItem, Tooltip, OverlayTrigger } from 'react-bootstrap';
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

  componentDidMount(){
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
    if(response.response.status === 204) {
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
    if(response.response.status === 204) {
      this.setState({events: this.state.events.filter(event => event.id !== id)})
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
        if(error.response.data.statusCode === 404){
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
        if(error.response.data.statusCode === 404){
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
        if(error.response.data.statusCode === 404){
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

    return axios.get(`${API_ROOT_URL}/api/v1/event_exports?${format}${startTS}${stopTS}${value}${author}${freetext}${datasource}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }).then((response) => {
        return response.data
      }).catch((error)=>{
        if(error.response.data.statusCode === 404){
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

  async toggleASNAP() {
    await this.setState( prevState => ({hideASNAP: !prevState.hideASNAP, activePage: 1}))
    this.fetchEventsForDisplay();
  }

  renderEventListHeader() {

    const Label = "Filtered Events"
    const exportTooltip = (<Tooltip id="deleteTooltip">Export these events</Tooltip>)
    const toggleASNAPTooltip = (<Tooltip id="toggleASNAPTooltip">Show/Hide ASNAP Events</Tooltip>)

    const ASNAPToggleIcon = (this.state.hideASNAP)? "Show ASNAP" : "Hide ASNAP"
    const ASNAPToggle = (<span disabled={this.props.event.fetching} style={{ marginRight: "10px" }} onClick={() => this.toggleASNAP()}>{ASNAPToggleIcon}</span>)

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

  renderEvents() {

    if(this.state.events && this.state.events.length > 0){

      let eventList = this.state.events.map((event, index) => {
        if(index >= (this.state.activePage-1) * maxEventsPerPage && index < (this.state.activePage * maxEventsPerPage)) {
        
          let comment_exists = false;

          let eventOptionsArray = event.event_options.reduce((filtered, option) => {
            if(option.event_option_name === 'event_comment') {
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
          let commentIcon = (comment_exists)? <FontAwesomeIcon onClick={() => this.handleEventCommentModal(event)} icon='comment' fixedWidth transform="grow-4"/> : <span onClick={() => this.handleEventCommentModal(event)} className="fa-layers fa-fw"><FontAwesomeIcon icon='comment' fixedWidth transform="grow-4"/><FontAwesomeIcon className={ "text-secondary" } icon='plus' fixedWidth inverse transform="shrink-4"/></span>
          let commentTooltip = (comment_exists)? (<OverlayTrigger placement="top" overlay={<Tooltip id={`commentTooltip_${event.id}`}>Edit/View Comment</Tooltip>}>{commentIcon}</OverlayTrigger>) : (<OverlayTrigger placement="top" overlay={<Tooltip id={`commentTooltip_${event.id}`}>Add Comment</Tooltip>}>{commentIcon}</OverlayTrigger>)

          let deleteIcon = <FontAwesomeIcon className={"text-danger"} onClick={() => this.handleEventDeleteModal(event)} icon='trash' fixedWidth/>
          let deleteTooltip = (this.props.roles && this.props.roles.includes("admin"))? (<OverlayTrigger placement="top" overlay={<Tooltip id={`deleteTooltip_${event.id}`}>Delete this event</Tooltip>}>{deleteIcon}</OverlayTrigger>): null

          return (<ListGroup.Item className="event-list-item" key={event.id}><span onClick={() => this.handleEventShowDetailsModal(event)}>{event.ts} {`<${event.event_author}>`}: {event.event_value} {eventOptions}</span><span className="float-right">{deleteTooltip} {commentTooltip}</span></ListGroup.Item>);
        }
      })

      return eventList;
    }

    return (<ListGroup.Item key="emptyHistory" >No events found</ListGroup.Item>)
  }

  renderEventCard() {

    if (!this.state.events) {
      return (
        <Card border="secondary">
          <Card.Header>{ this.renderEventListHeader() }</Card.Header>
          <Card.Body>Loading...</Card.Body>
        </Card>
      )
    }

    return (
      <Card border="secondary">
        <Card.Header>{ this.renderEventListHeader() }</Card.Header>
        <ListGroup>
          {this.renderEvents()}
        </ListGroup>
      </Card>
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
        if (i === 1 || i === last || i >= left && i < right) {
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
        <Pagination style={{marginTop: "8px"}}>
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
          <Col sm={12} md={8} lg={8}>
            {this.renderEventCard()}
            {this.renderPagination()}
          </Col>
          <Col sm={12} md={4} lg={4}>
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
