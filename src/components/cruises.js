import React, { Component } from 'react';
import FontAwesome from 'react-fontawesome';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { reduxForm, Field, reset } from 'redux-form';
import { FormGroup, Grid, Row, Button, Col, Panel, Alert, Table, OverlayTrigger, Tooltip, Pagination } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { ROOT_PATH } from '../url_config';
import CreateCruise from './create_cruise';
import UpdateCruise from './update_cruise';
import DeleteCruiseModal from './delete_cruise_modal';
import ImportCruisesModal from './import_cruises_modal';
import * as actions from '../actions';

let fileDownload = require('js-file-download');

const cruisesPerPage = 15

class Cruises extends Component {

  constructor (props) {
    super(props);

    this.state = {
      activePage: 1
    }

    this.handlePageSelect = this.handlePageSelect.bind(this);
  }

  componentWillMount() {
      this.props.fetchCruises();
  }

  handlePageSelect(eventKey) {
    // console.log("eventKey:", eventKey)
    this.setState({activePage: eventKey});
  }

  handleCruiseDelete(id) {
    this.props.showModal('deleteCruise', { id: id, handleDelete: this.props.deleteCruise });
  }

  handleCruiseSelect(id) {
    // console.log("Set Cruise:", id)
    this.props.initCruise(id);
  }

  handleCruiseShow(id) {
    // console.log("Set Cruise:", id)
    this.props.showCruise(id);
  }

  handleCruiseHide(id) {
    // console.log("Set Cruise:", id)
    this.props.hideCruise(id);
  }

  handleCruiseCreate() {
    // console.log("Clear");
    this.props.leaveUpdateCruiseForm()
  }

  exportCruisesToJSON() {
    fileDownload(JSON.stringify(this.props.cruises, null, "\t"), 'seaplay_cruisesExport.json');
  }

  handleImportCruiseList() {
    this.props.showModal('importCruises', { });

    // const options = {
    //   baseUrl: 'http://127.0.0.1',
    //   query: {
    //     warrior: 'fight'
    //   }
    // }

    // /* Use ReactUploadFile with options */
    // /* Custom your buttons */
    // return (
    //   <ReactUploadFile options={options} uploadFileButton={<FontAwesome name='upload' fixedWidth/>} />
    // );
  }

  renderAddCruiseButton() {
    if (!this.props.showform && this.props.roles && this.props.roles.includes('admin')) {
      return (
        <div className="pull-right">
          <Button bsStyle="primary" bsSize="small" type="button" onClick={ () => this.handleCruiseCreate()}>Add Cruise</Button>
        </div>
      );
    }
  }

  renderCruises() {

    const editTooltip = (<Tooltip id="editTooltip">Edit this cruise.</Tooltip>)
    const deleteTooltip = (<Tooltip id="deleteTooltip">Delete this cruise.</Tooltip>)
    const showTooltip = (<Tooltip id="deleteTooltip">Allow users to view this cruise.</Tooltip>)
    const hideTooltip = (<Tooltip id="deleteTooltip">Hide this cruise from users.</Tooltip>)

    if(this.props.cruises && this.props.cruises.length > 0){

      return this.props.cruises.map((cruise, index) => {
        if(index >= (this.state.activePage-1) * cruisesPerPage && index < (this.state.activePage * cruisesPerPage)) {
          let deleteLink = (this.props.roles.includes('admin'))? <Link key={`delete_${cruise.id}`} to="#" onClick={ () => this.handleCruiseDelete(cruise.id) }><OverlayTrigger placement="top" overlay={deleteTooltip}><FontAwesome name='trash' fixedWidth/></OverlayTrigger></Link>: null
          let hiddenLink = null;
          if(this.props.roles.includes('admin') && cruise.cruise_hidden) {
            hiddenLink = <Link key={`show_${cruise.id}`} to="#" onClick={ () => this.handleCruiseShow(cruise.id) }><OverlayTrigger placement="top" overlay={showTooltip}><FontAwesome name='eye-slash' fixedWidth/></OverlayTrigger></Link>
          } else if(this.props.roles.includes('admin') && !cruise.cruise_hidden) {
            hiddenLink = <Link key={`show_${cruise.id}`} to="#" onClick={ () => this.handleCruiseHide(cruise.id) }><OverlayTrigger placement="top" overlay={hideTooltip}><FontAwesome name='eye' fixedWidth/></OverlayTrigger></Link>  
          }

          return (
            <tr key={cruise.id}>
              <td>{cruise.cruise_id}</td>
              <td>{cruise.cruise_name}</td>
              <td>{cruise.cruise_pi}</td>
              <td>
                <Link key={`edit_${cruise.id}`} to="#" onClick={ () => this.handleCruiseSelect(cruise.id) }><OverlayTrigger placement="top" overlay={editTooltip}><FontAwesome name='pencil' fixedWidth/></OverlayTrigger></Link>
                {' '}
                {deleteLink}
                {' '}
                {hiddenLink}
              </td>
            </tr>
          );
        }
      })      
    }

    return (
      <tr key="noCruisesFound">
        <td colSpan="4"> No cruises found!</td>
      </tr>
    )
  }

  renderCruiseTable() {
    return (
      <Panel>
        <Table responsive bordered striped fill>
          <thead>
            <tr>
              <th>Cruise ID</th>
              <th>Cruise Name</th>
              <th>P.I.</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {this.renderCruises()}
          </tbody>
        </Table>
      </Panel>
    )
  }

  renderCruiseHeader() {

    const Label = "Cruises"

    // const importTooltip = (<Tooltip id="importTooltip">Import Cruises</Tooltip>)
    const exportTooltip = (<Tooltip id="exportTooltip">Export Cruises</Tooltip>)

    // <Button bsStyle="default" bsSize="xs" type="button" onClick={ this.handleImportCruiseList }><OverlayTrigger placement="top" overlay={importTooltip}><FontAwesome name='upload' fixedWidth/></OverlayTrigger></Button>



    return (
      <div>
        { Label }
        <div className="pull-right">
          <Button bsStyle="default" bsSize="xs" type="button" onClick={ () => this.exportCruisesToJSON() }><OverlayTrigger placement="top" overlay={exportTooltip}><FontAwesome name='download' fixedWidth/></OverlayTrigger></Button>
        </div>
      </div>
    );
  }

  renderPagination() {
    let cruiseCount = this.props.cruises.length

    return (
      <Pagination
        prev
        next
        first
        last
        ellipsis
        boundaryLinks
        items={ Math.ceil(cruiseCount/cruisesPerPage) }
        maxButtons={5}
        activePage={this.state.activePage}
        onSelect={this.handlePageSelect}
      />
    )
  }

  render() {
    if (!this.props.roles) {
        return (
          <div>Loading...</div>
        )
    }

    if(this.props.roles.includes("admin") || this.props.roles.includes('cruise_manager')) {

      let cruiseForm = (this.props.cruiseid)? <UpdateCruise /> : <CreateCruise />

      return (
        <Grid fluid>
          <DeleteCruiseModal />
          <Row>
            <Col sm={10} md={7} lgOffset= {1} lg={6}>
              <Panel header={this.renderCruiseHeader()}>
                {this.renderCruiseTable()}
                {this.renderPagination()}
              </Panel>
              {this.renderAddCruiseButton()}
            </Col>
            <Col sm={6} md={5} lg={4}>
              { cruiseForm }
            </Col>
          </Row>
        </Grid>
      );

    } else {
      return (
        <div>
          What are YOU doing here?
        </div>
      )
    }
  }
}

function mapStateToProps(state) {
  return {
    cruises: state.cruise.cruises,
    cruiseid: state.cruise.cruise.id,
    profileid: state.user.profile.id,
    roles: state.user.profile.roles
  }
}

export default connect(mapStateToProps, actions)(Cruises);
