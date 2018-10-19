import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { reduxForm, Field, reset } from 'redux-form';
import { FormGroup, Row, Button, Col, Panel, Alert, Table, OverlayTrigger, Tooltip, Pagination } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { ROOT_PATH } from '../url_config';
import CreateCruise from './create_cruise';
import UpdateCruise from './update_cruise';
import DeleteCruiseModal from './delete_cruise_modal';
import ImportCruisesModal from './import_cruises_modal';
import * as actions from '../actions';

let fileDownload = require('js-file-download');

const maxCruisesPerPage = 15

class Cruises extends Component {

  constructor (props) {
    super(props);

    this.state = {
      activePage: 1
    }

    this.handlePageSelect = this.handlePageSelect.bind(this);
    this.handleCruiseImportClose = this.handleCruiseImportClose.bind(this);

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

  handleCruiseImport() {
    this.props.showModal('importCruises');
  }

  handleCruiseImportClose() {
    this.props.fetchCruises();
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
    //   <ReactUploadFile options={options} uploadFileButton={<FontAwesomeIcon icon='upload' fixedWidth/>} />
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

  renderImportCruisesButton() {
    if(this.props.roles.includes("admin")) {
      return (
        <div className="pull-right">
          <Button bsStyle="primary" bsSize="small" type="button" onClick={ () => this.handleCruiseImport()}>Import From File</Button>
        </div>
      );
    }
  }

  renderCruises() {

    const editTooltip = (<Tooltip id="editTooltip">Edit this cruise.</Tooltip>)
    const deleteTooltip = (<Tooltip id="deleteTooltip">Delete this cruise.</Tooltip>)
    const showTooltip = (<Tooltip id="deleteTooltip">Allow users to view this cruise.</Tooltip>)
    const hideTooltip = (<Tooltip id="deleteTooltip">Hide this cruise from users.</Tooltip>)

    return this.props.cruises.map((cruise, index) => {
      if(index >= (this.state.activePage-1) * maxCruisesPerPage && index < (this.state.activePage * maxCruisesPerPage)) {
        let deleteLink = (this.props.roles.includes('admin'))? <Link key={`delete_${cruise.id}`} to="#" onClick={ () => this.handleCruiseDelete(cruise.id) }><OverlayTrigger placement="top" overlay={deleteTooltip}><FontAwesomeIcon icon='trash' fixedWidth/></OverlayTrigger></Link>: null
        let hiddenLink = null;
        if(this.props.roles.includes('admin') && cruise.cruise_hidden) {
          hiddenLink = <Link key={`show_${cruise.id}`} to="#" onClick={ () => this.handleCruiseShow(cruise.id) }><OverlayTrigger placement="top" overlay={showTooltip}><FontAwesomeIcon icon='eye-slash' fixedWidth/></OverlayTrigger></Link>
        } else if(this.props.roles.includes('admin') && !cruise.cruise_hidden) {
          hiddenLink = <Link key={`show_${cruise.id}`} to="#" onClick={ () => this.handleCruiseHide(cruise.id) }><OverlayTrigger placement="top" overlay={hideTooltip}><FontAwesomeIcon icon='eye' fixedWidth/></OverlayTrigger></Link>  
        }

        return (
          <tr key={cruise.id}>
            <td>{cruise.cruise_id}</td>
            <td>{cruise.cruise_name}</td>
            <td>{cruise.cruise_pi}</td>
            <td>
              <Link key={`edit_${cruise.id}`} to="#" onClick={ () => this.handleCruiseSelect(cruise.id) }><OverlayTrigger placement="top" overlay={editTooltip}><FontAwesomeIcon icon='pencil-alt' fixedWidth/></OverlayTrigger></Link>
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

  renderCruiseTable() {
    if(this.props.cruises && this.props.cruises.length > 0) {
      return (
        <Table responsive bordered striped>
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
      )
    } else {
      return (
        <Panel.Body>No Cruises found!</Panel.Body>
      )
    }
  }

  renderCruiseHeader() {

    const Label = "Cruises"

    // const importTooltip = (<Tooltip id="importTooltip">Import Cruises</Tooltip>)
    const exportTooltip = (<Tooltip id="exportTooltip">Export Cruises</Tooltip>)

    // <Button bsStyle="default" bsSize="xs" type="button" onClick={ this.handleImportCruiseList }><OverlayTrigger placement="top" overlay={importTooltip}><FontAwesomeIcon icon='upload' fixedWidth/></OverlayTrigger></Button>



    return (
      <div>
        { Label }
        <div className="pull-right">
          <Button bsStyle="default" bsSize="xs" type="button" onClick={ () => this.exportCruisesToJSON() }><OverlayTrigger placement="top" overlay={exportTooltip}><FontAwesomeIcon icon='download' fixedWidth/></OverlayTrigger></Button>
        </div>
      </div>
    );
  }

  renderPagination() {
    if(this.props.cruises && this.props.cruises.length > maxCruisesPerPage) {

      let priceCount = this.props.cruises.length;
      let last = Math.ceil(priceCount/maxCruisesPerPage);
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
            rangeWithDots.push(<Pagination.Ellipsis />);
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

  render() {
    if (!this.props.roles) {
        return (
          <div>Loading...</div>
        )
    }

    if(this.props.roles.includes("admin") || this.props.roles.includes('cruise_manager')) {

      let cruiseForm = (this.props.cruiseid)? <UpdateCruise /> : <CreateCruise />

      return (
        <div>
          <DeleteCruiseModal />
          <ImportCruisesModal  handleExit={this.handleCruiseImportClose} />
          <Row>
            <Col sm={10} md={7} lgOffset= {1} lg={6}>
              <Panel>
                <Panel.Heading>{this.renderCruiseHeader()}</Panel.Heading>
                  {this.renderCruiseTable()}
                  {this.renderPagination()}
              </Panel>
              {this.renderAddCruiseButton()}
              {this.renderImportCruisesButton()}
            </Col>
            <Col sm={6} md={5} lg={4}>
              { cruiseForm }
            </Col>
          </Row>
        </div>
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
