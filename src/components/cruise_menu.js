import axios from 'axios';
import React, { Component } from 'react';
import Cookies from 'universal-cookie';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';
import { connect } from 'react-redux';
import { Accordion, Button, Container, Row, Col, Card, CardGroup } from 'react-bootstrap';
import FileDownload from 'js-file-download';
import { API_ROOT_URL, MAIN_SCREEN_TXT } from '../client_config';

import * as actions from '../actions';

const CRUISE_ROUTE = "/files/cruises";
const LOWERING_ROUTE = "/files/lowerings";

const cookies = new Cookies();

class CruiseMenu extends Component {

  constructor (props) {
    super(props);

    this.state = {
      activeCruiseKey: null,
      cruiseLowerings: null,
      activeCruise: null,
      activeLowering: null

    };

    this.handleCruiseSelect = this.handleCruiseSelect.bind(this);
    this.handleLoweringSelect = this.handleLoweringSelect.bind(this);
    this.handleCruiseFileDownload = this.handleCruiseFileDownload.bind(this);
    this.handleLoweringFileDownload = this.handleLoweringFileDownload.bind(this);

  }

  componentDidMount(){
    this.props.fetchCruises();
    this.props.fetchLowerings();
  }

  componentDidUpdate(){

    if(this.props.cruise.id && this.props.lowerings.length > 0 && this.state.activeCruise === null) {
      // console.log("selected cruise but no active cruise")
      this.handleCruiseSelect(this.props.cruise.id)
      this.buildLoweringList(this.props.cruise.start_ts, this.props.cruise.stop_ts)
    }
    // else if(this.props.cruises.length > 0 && this.props.lowerings.length > 0 && this.state.activeCruise === null) {
    //   console.log("cruiselist but no active cruise")
    //   this.handleCruiseSelect(this.props.cruises[0].id)
    //   this.buildLoweringList(this.props.cruises[0].start_ts, this.props.cruises[0].stop_ts)
    // }

    if(this.props.lowering.id && this.props.lowerings.length > 0 && this.state.activeLowering === null) {
      // console.log("selected lowering but there is no active lowering")
      this.handleLoweringSelect(this.props.lowering.id)
    }

    if(this.state.activeCruise != null && this.state.cruiseLowerings === null) {
      // console.log("active cruise but null cruise lowerings")
      this.buildLoweringList(this.state.activeCruise.start_ts, this.state.activeCruise.stop_ts)
    }

    if(this.state.activeCruise === null && this.state.activeLowering != null) {
      // console.log("no active cruise but there is an active lowering")
      this.handleLoweringSelect();
    }
  }

  componentWillUnmount(){
  }

  handleCruiseSelect(id) {
    if(this.state.activeCruise === null || this.state.activeCruise && this.state.activeCruise.id != id) {
      window.scrollTo(0, 0);
      const activeCruise = this.props.cruises.find(cruise => cruise.id === id)
      this.buildLoweringList(activeCruise.start_ts, activeCruise.stop_ts)
      this.setState({activeCruiseKey: activeCruise.id, activeCruise: activeCruise});
      this.handleLoweringSelect()
    }
  }

  handleLoweringSelect(id = null) {
    window.scrollTo(0, 0);
    if(id != null) {
      this.setState({activeLowering: this.props.lowerings.find(lowering => lowering.id === id)});
    } else {
      this.props.clearSelectedLowering()
      this.setState({activeLowering: null});
    }
  }

  handleLoweringSelectForReplay() {
    if(this.state.activeLowering) {
      this.props.clearEvents()
      this.props.gotoLoweringReplay(this.state.activeLowering.id);
    }
  }

  handleLoweringSelectForReview() {
    if(this.state.activeLowering) {
      this.props.clearEvents()
      this.props.gotoLoweringReview(this.state.activeLowering.id);
    }
  }

  handleLoweringSelectForGallery() {
    if(this.state.activeLowering) {
      this.props.clearEvents()
      this.props.gotoLoweringGallery(this.state.activeLowering.id);
    }
  }

  handleLoweringFileDownload(loweringID, filename) {
    axios.get(`${API_ROOT_URL}${LOWERING_ROUTE}/${loweringID}/${filename}`,
    {
      headers: {
        authorization: cookies.get('token')
      },
      responseType: 'arraybuffer'
    })
    .then((response) => {
        FileDownload(response.data, filename);
     })
    .catch((error)=>{
      console.log("JWT is invalid, logging out");
    });
  }

  handleCruiseFileDownload(cruiseID, filename) {
    axios.get(`${API_ROOT_URL}${CRUISE_ROUTE}/${cruiseID}/${filename}`,
    {
      headers: {
        authorization: cookies.get('token')
      },
      responseType: 'arraybuffer'
    })
    .then((response) => {
        FileDownload(response.data, filename);
     })
    .catch((error)=>{
      console.log("JWT is invalid, logging out");
    });
  }

  renderCruiseFiles(cruiseID, files) {
    let output = files.map((file, index) => {
      return <li style={{ listStyleType: "none" }} key={`file_${index}`}><span onClick={() => this.handleCruiseFileDownload(cruiseID, file)}><FontAwesomeIcon className='text-primary' icon='download' fixedWidth /></span><span> {file}</span></li>
    })
    return <div>{output}<br/></div>
  }

  renderLoweringFiles(loweringID, files) {
    let output = files.map((file, index) => {
      return <li style={{ listStyleType: "none" }} key={`file_${index}`}><span onClick={() => this.handleLoweringFileDownload(loweringID, file)}><FontAwesomeIcon className='text-primary' icon='download' fixedWidth /></span><span> {file}</span></li>
    })
    return <div>{output}<br/></div>
  }

  renderLoweringCard() {

    if(this.state.activeLowering){
      let loweringStartTime = moment(this.state.activeLowering.start_ts)
      let loweringEndTime = moment(this.state.activeLowering.stop_ts)
      let loweringDurationValue = loweringEndTime.diff(loweringStartTime)

      let loweringDescription = (this.state.activeLowering.lowering_additional_meta.lowering_description)? <span><strong>Description:</strong> {this.state.activeLowering.lowering_additional_meta.lowering_description}<br/></span> : null
      let loweringLocation = (this.state.activeLowering.lowering_location)? <span><strong>Location:</strong> {this.state.activeLowering.lowering_location}<br/></span> : null
      let loweringStarted = <span><strong>Started:</strong> {loweringStartTime.format("YYYY-MM-DD hh:mm")}<br/></span>
      let loweringDuration = <span><strong>Duration:</strong> {moment.duration(loweringDurationValue).format("d [days] h [hours] m [minutes]")}<br/></span>
      let loweringFiles = (this.state.activeLowering.lowering_additional_meta.lowering_files && this.state.activeLowering.lowering_additional_meta.lowering_files.length > 0)? <span><strong>Files:</strong><br/>{this.renderLoweringFiles(this.state.activeLowering.id, this.state.activeLowering.lowering_additional_meta.lowering_files)}</span>: null


      return (          
        <Card border="secondary" key={`lowering_card`}>
          <Card.Header>Lowering: <span className="text-primary">{this.state.activeLowering.lowering_id}</span></Card.Header>
          <Card.Body>
            {loweringDescription}
            {loweringLocation}
            {loweringStarted}
            {loweringDuration}
            {loweringFiles}
            <br/>
            <ul>
              <li className="text-primary" onClick={ () => this.handleLoweringSelectForGallery() }>Goto gallery...</li>
              <li className="text-primary" onClick={ () => this.handleLoweringSelectForReplay() }>Goto replay...</li>
              <li className="text-primary" onClick={ () => this.handleLoweringSelectForSearch() }>Goto review...</li>
            </ul>
          </Card.Body>
        </Card>
      );
    }
  }


  buildLoweringList(start_ts, stop_ts) {
    this.setState({ cruiseLowerings: this.props.lowerings.filter(lowering => moment.utc(lowering.start_ts).isBetween(start_ts, stop_ts)) })
  }

  renderCruiseListItems() {

    return this.props.cruises.map((cruise, index) => {

      let cruiseName = (cruise.cruise_additional_meta.cruise_name)? <span><strong>Cruise Name:</strong> {cruise.cruise_additional_meta.cruise_name}<br/></span> : null
      let cruiseDescription = (cruise.cruise_additional_meta.cruise_description)? <span><strong>Description:</strong> {cruise.cruise_additional_meta.cruise_description}<br/></span> : null
      let cruiseLocation = (cruise.cruise_location)? <span><strong>Location:</strong> {cruise.cruise_location}<br/></span> : null
      let cruiseDates = <span><strong>Dates:</strong> {moment.utc(cruise.start_ts).format("YYYY/MM/DD")} - {moment.utc(cruise.stop_ts).format("YYYY/MM/DD")}<br/></span>
      let cruisePI = <span><strong>Chief Scientist:</strong> {cruise.cruise_pi}<br/></span>
      let cruiseFiles = (cruise.cruise_additional_meta.cruise_files && cruise.cruise_additional_meta.cruise_files.length > 0)? <span><strong>Files:</strong><br/>{this.renderCruiseFiles(cruise.id, cruise.cruise_additional_meta.cruise_files)}</span>: null
      
      let lowerings = (this.state.cruiseLowerings)? (
        <ul>
          { this.state.cruiseLowerings.map((lowering) => {
              if(this.state.activeLowering && lowering.id == this.state.activeLowering.id) {
                return (<li key={`select_${lowering.id}`} ><span className="text-warning">{lowering.lowering_id}</span><br/></li>)
              }

              return (<li key={`select_${lowering.id}`} onClick={ () => this.handleLoweringSelect(lowering.id)}><span className="text-primary">{lowering.lowering_id}</span></li>)
            })
          }
        </ul>
      ): null

      return (          
        <Card border="secondary" key={cruise.id} >
          <Accordion.Toggle as={Card.Header} eventKey={cruise.id}>
            <h6>Cruise: <span className="text-primary">{cruise.cruise_id}</span></h6>
          </Accordion.Toggle>
          <Accordion.Collapse eventKey={cruise.id}>
            <Card.Body>
              {cruiseName}
              {cruiseDescription}
              {cruiseLocation}
              {cruiseDates}
              {cruisePI}
              {cruiseFiles}
              {
                (this.state.cruiseLowerings && this.state.cruiseLowerings.length > 0)? (
                  <div>
                    <p><strong>Lowerings:</strong></p>
                    {lowerings}
                  </div>
                ): null
              }
            </Card.Body>
          </Accordion.Collapse>
        </Card>
      );
    })      
  }

  renderCruiseList() {

    if(this.props.cruises && this.props.cruises.length > 0){

      return (
        <Accordion id="accordion-controlled-example" activeKey={this.state.activeCruiseKey} onSelect={this.handleCruiseSelect}>
          {this.renderCruiseListItems()}
        </Accordion>
      )
    } else {
      return (
        <Card>
          <Card.Body>No cruises found!</Card.Body>
        </Card>
      )
    }

    return (
      <div>
        {this.renderCruiseListItems()}
      </div>
    )
  }

  render(){
    return (
      <div>
        <Row>
          <Col xs={12}>
            <h4>Welcome to Sealog</h4>
            {MAIN_SCREEN_TXT}
            <br/><br/>
          </Col>
        </Row>
        <Row>
          <Col sm={6} md={{span: 5, offset: 1}} xl={{span: 4, offset: 2}}>
            {this.renderCruiseList()}
          </Col>
          <Col sm={6} md={5} xl={4}>
            {this.renderLoweringCard()}
          </Col>
        </Row>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    cruise: state.cruise.cruise,
    cruises: state.cruise.cruises,
    lowering: state.lowering.lowering,  
    lowerings: state.lowering.lowerings,  
    roles: state.user.profile.roles
  }
}

export default connect(mapStateToProps, null)(CruiseMenu);
