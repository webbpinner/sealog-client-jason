import React, { Component } from 'react';
import FontAwesome from 'react-fontawesome';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { reduxForm, Field, reset } from 'redux-form';
import { FormGroup, Grid, Row, Button, Col, Panel, Alert, Table, OverlayTrigger, Tooltip, Pagination } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { ROOT_PATH } from '../url_config';
import CreateLowering from './create_lowering';
import UpdateLowering from './update_lowering';
import DeleteLoweringModal from './delete_lowering_modal';
import ImportLoweringsModal from './import_lowerings_modal';
import * as actions from '../actions';

let fileDownload = require('js-file-download');

const loweringsPerPage = 15

class Lowerings extends Component {

  constructor (props) {
    super(props);

    this.state = {
      activePage: 1
    }

    this.handlePageSelect = this.handlePageSelect.bind(this);

  }

  componentWillMount() {
      this.props.fetchLowerings();
  }

  handlePageSelect(eventKey) {
    // console.log("eventKey:", eventKey)
    this.setState({activePage: eventKey});
  }

  handleLoweringDelete(id) {
    this.props.showModal('deleteLowering', { id: id, handleDelete: this.props.deleteLowering });
  }

  handleLoweringShow(id) {
    // console.log("Set Lowering:", id)
    this.props.showLowering(id);
  }

  handleLoweringHide(id) {
    // console.log("Set Lowering:", id)
    this.props.hideLowering(id);
  }

  handleLoweringSelect(id) {
    // console.log("Set Lowering:", id)
    this.props.initLowering(id);
  }

  handleLoweringCreate() {
    // console.log("Clear");
    this.props.leaveUpdateLoweringForm()
  }

  exportLoweringsToJSON() {
    fileDownload(JSON.stringify(this.props.lowerings, null, 2), 'seaplay_loweringExport.json');
  }

  renderAddLoweringButton() {
    if (!this.props.showform && this.props.roles && this.props.roles.includes('admin')) {
      return (
        <div className="pull-right">
          <Button bsStyle="primary" bsSize="small" type="button" onClick={ () => this.handleLoweringCreate()}>Add Lowering</Button>
        </div>
      );
    }
  }

  renderLowerings() {

    const editTooltip = (<Tooltip id="editTooltip">Edit this lowering.</Tooltip>)
    const deleteTooltip = (<Tooltip id="deleteTooltip">Delete this lowering.</Tooltip>)
    const showTooltip = (<Tooltip id="deleteTooltip">Allow users to view this lowering.</Tooltip>)
    const hideTooltip = (<Tooltip id="deleteTooltip">Hide this lowering from users.</Tooltip>)


    if(this.props.lowerings && this.props.lowerings.length > 0){
      return this.props.lowerings.map((lowering, index) => {
        if(index >= (this.state.activePage-1) * loweringsPerPage && index < (this.state.activePage * loweringsPerPage)) {

          let deleteLink = (this.props.roles.includes('admin'))? <Link key={`delete_${lowering.id}`} to="#" onClick={ () => this.handleLoweringDelete(lowering.id) }><OverlayTrigger placement="top" overlay={deleteTooltip}><FontAwesome name='trash' fixedWidth/></OverlayTrigger></Link>: null
          let hiddenLink = null;
          if(this.props.roles.includes('admin') && lowering.lowering_hidden) {
            hiddenLink = <Link key={`show_${lowering.id}`} to="#" onClick={ () => this.handleLoweringShow(lowering.id) }><OverlayTrigger placement="top" overlay={showTooltip}><FontAwesome name='eye-slash' fixedWidth/></OverlayTrigger></Link>
          } else if(this.props.roles.includes('admin') && !lowering.lowering_hidden) {
            hiddenLink = <Link key={`show_${lowering.id}`} to="#" onClick={ () => this.handleLoweringHide(lowering.id) }><OverlayTrigger placement="top" overlay={hideTooltip}><FontAwesome name='eye' fixedWidth/></OverlayTrigger></Link>  
          }

          return (
            <tr key={lowering.id}>
              <td>{lowering.lowering_id}</td>
              <td>{lowering.lowering_location}</td>
              <td>
                <Link key={`edit_${lowering.id}`} to="#" onClick={ () => this.handleLoweringSelect(lowering.id) }><OverlayTrigger placement="top" overlay={editTooltip}><FontAwesome name='pencil' fixedWidth/></OverlayTrigger></Link>
                {' '}
                { deleteLink }
                {' '}
                {hiddenLink}
              </td>
            </tr>
          );
        }
      })      
    }

    return (
      <tr key="noLoweringsFound">
        <td colSpan="4"> No lowerings found!</td>
      </tr>
    )
  }

  renderLoweringTable() {
    return (
      <Panel>
        <Table responsive bordered striped fill>
          <thead>
            <tr>
              <th>Lowering</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {this.renderLowerings()}
          </tbody>
        </Table>
      </Panel>
    )
  }

  renderLoweringHeader() {

    const Label = "Lowerings"
    const exportTooltip = (<Tooltip id="exportTooltip">Export Lowerings</Tooltip>)

    return (
      <div>
        { Label }
        <div className="pull-right">
          <Button bsStyle="default" bsSize="xs" type="button" onClick={ () => this.exportLoweringsToJSON() }><OverlayTrigger placement="top" overlay={exportTooltip}><FontAwesome name='download' fixedWidth/></OverlayTrigger></Button>
        </div>
      </div>
    );
  }

  renderPagination() {
    let loweringCount = this.props.lowerings.length

    return (
      <Pagination
        prev
        next
        first
        last
        ellipsis
        boundaryLinks
        items={ Math.ceil(loweringCount/loweringsPerPage) }
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

      let loweringForm = (this.props.loweringid)? <UpdateLowering /> : <CreateLowering />

      return (
        <Grid fluid>
          <DeleteLoweringModal />
          <Row>
            <Col sm={10} md={7} lgOffset= {1} lg={6}>
              <Panel header={this.renderLoweringHeader()}>
                {this.renderLoweringTable()}
                {this.renderPagination()}
              </Panel>
              {this.renderAddLoweringButton()}
            </Col>
            <Col sm={6} md={5} lg={4}>
              { loweringForm }
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
    lowerings: state.lowering.lowerings,
    loweringid: state.lowering.lowering.id,
    roles: state.user.profile.roles
  }
}

export default connect(mapStateToProps, actions)(Lowerings);