import axios from 'axios';
import React, { Component } from 'react';
import Cookies from 'universal-cookie';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { Button, Row, Col, Panel, PanelGroup, ListGroup, ListGroupItem } from 'react-bootstrap';
import FileDownload from 'js-file-download';
import { API_ROOT_URL } from '../url_config';

import * as actions from '../actions';

const CRUISE_ROUTE = "/files/cruises";
const LOWERING_ROUTE = "/files/lowerings";

const cookies = new Cookies();

class CruiseMenu extends Component {

  constructor (props) {
    super(props);

    this.state = {
      activeKey: "0"
    };

    this.handleSelect = this.handleSelect.bind(this);
    this.handleCruiseFileDownload = this.handleCruiseFileDownload.bind(this);
    this.handleLoweringFileDownload = this.handleLoweringFileDownload.bind(this);

  }

  componentWillMount(){
    this.props.clearSelectedCruise();
    this.props.clearSelectedLowering();
    this.props.leaveEventFilterForm();
    this.props.fetchCruises();
    this.props.fetchLowerings();
  }

  componentWillUnmount(){
    this.props.leaveUpdateLoweringForm();
  }

  handleLoweringSelect(id) {
    window.scrollTo(0, 0);
    this.props.initLowering(id);
  }

  handleLoweringSelectForReplay(id) {
    // console.log("loweringID:", id)
    this.props.gotoLoweringReplay(id);
  }

  handleLoweringSelectForSearch(id) {
    // console.log("loweringID:", id)
    this.props.gotoLoweringSearch(id);
  }

  handleLoweringFileDownload(loweringID, filename) {
    axios.get(`${API_ROOT_URL}${LOWERING_ROUTE}/${loweringID}/${filename}`,
    {
      headers: {
        authorization: cookies.get('token')
      }
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
      }
    })
    .then((response) => {
        FileDownload(response.data, filename);
     })
    .catch((error)=>{
      console.log("JWT is invalid, logging out");
    });
  }


  handleSelect(activeKey) {
    this.setState({ activeKey });
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

  renderLoweringPanel() {

    if(this.props.lowering.id){
      let lowering_files = (this.props.lowering.lowering_files && this.props.lowering.lowering_files.length > 0)? this.renderLoweringFiles(this.props.lowering.id, this.props.lowering.lowering_files): null

      return (          
        <Panel>
          <Panel.Heading>{"Lowering: " + this.props.lowering.lowering_id}</Panel.Heading>
          <Panel.Body>
            <p><strong>Description:</strong> {this.props.lowering.lowering_description}</p>
            <p><strong>Location:</strong> {this.props.lowering.lowering_location}</p>
            <p><strong>Date:</strong> {moment.utc(this.props.lowering.start_ts).format("YYYY/MM/DD HH:mm")} - {moment.utc(this.props.lowering.stop_ts).format("YYYY/MM/DD HH:mm")}</p>
            {lowering_files}
            <Button bsSize={'sm'} bsStyle={'primary'} onClick={ () => this.handleLoweringSelectForReplay(this.props.lowering.id) }>Goto replay...</Button>
            <Button bsSize={'sm'} bsStyle={'primary'} onClick={ () => this.handleLoweringSelectForSearch(this.props.lowering.id) }>Goto review...</Button>
          </Panel.Body>
        </Panel>
      );
    }
  }


  renderLoweringList(start_ts, stop_ts) {
    // console.log("lowerings:", this.props.lowerings);
    // console.log("lowering start:", this.props.lowerings[0].start_ts);
    // console.log("cruise start:", start_ts);
    // console.log("cruise stop:", stop_ts);

    let cruiseLowerings = this.props.lowerings.filter(lowering => moment.utc(lowering.start_ts).isBetween(start_ts, stop_ts) )
    // console.log(cruiseLowerings)
    return cruiseLowerings
  }

  renderCruiseListItems() {

    return this.props.cruises.map((cruise, index) => {
      let cruiseLowerings = this.renderLoweringList(cruise.start_ts, cruise.stop_ts)

      let cruise_files = (cruise.cruise_files && cruise.cruise_files.length > 0)? this.renderCruiseFiles(cruise.id, cruise.cruise_files): null

      return (          
        <Panel key={`panel_${index}`} eventKey={index.toString()}>
          <Panel.Heading><Panel.Title toggle>{"Cruise: " + cruise.cruise_id}</Panel.Title></Panel.Heading>
          <Panel.Body collapsible>
            <p><strong>Cruise Name:</strong> {cruise.cruise_name}</p>
            <p><strong>Chief Scientist:</strong> {cruise.cruise_pi}</p>
            <p><strong>Location:</strong> {cruise.cruise_location}</p>
            <p><strong>Description:</strong> {cruise.cruise_description}</p>
            <p><strong>Dates:</strong> {moment.utc(cruise.start_ts).format("YYYY/MM/DD")} - {moment.utc(cruise.stop_ts).format("YYYY/MM/DD")}</p>
            {cruise_files}
            <p><strong>Lowerings:</strong></p>
            <ul>
              { cruiseLowerings.map(lowering => (
                  <li key={`select_${lowering.id}`} ><Link to="#" onClick={ () => this.handleLoweringSelect(lowering.id) }>{lowering.lowering_id}</Link><br/></li>
                ))
              }
            </ul>
          </Panel.Body>
        </Panel>
      );
    })      
  }

  renderCruiseList() {

    if(this.props.cruises && this.props.cruises.length > 0){
      return (
        <PanelGroup id="accordion-controlled-example" accordion defaultActiveKey="0" onSelect={this.handleSelect}>
          {this.renderCruiseListItems()}
        </PanelGroup>
      )
    } else {
      return (
        <Panel>
          <Panel.Body>No cruises found!</Panel.Body>
        </Panel>
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
            Sealog provides the NDSF user community with at-sea access to in-situ observations, still imagery, position/attitude data, and sensor data from the Alvin HOV for review and analysis<br/><br/>
          </Col>
        </Row>
        <Row>
          <Col sm={6} mdOffset= {1} md={5} lgOffset= {2} lg={4}>
            {this.renderCruiseList()}
          </Col>
          <Col sm={6} md={5} lg={4}>
            {this.renderLoweringPanel()}
          </Col>
        </Row>
        <Row>
          <Col>
            Please select a cruise from the list above.  Once a cruise is selected please select a lowering from the list of lowerings associated with that cruise that appear at the bottom of the cruise information panel.  Selecting a lowering will open the lowering information panel.  At the bottom of the cruise information panel there will be buttons for proceeding to the lowering replay section of Sealog or the lowering event search section of Sealog.
            If at any time you wish to return to this page please click the "Sealog" text in upper-left part of the window.
          </Col>
        </Row>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    cruises: state.cruise.cruises,
    lowering: state.lowering.lowering,  
    lowerings: state.lowering.lowerings,  
    roles: state.user.profile.roles
  }
}

export default connect(mapStateToProps, null)(CruiseMenu);