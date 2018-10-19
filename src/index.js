import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Cookies from 'universal-cookie';
import { AUTH_USER } from './actions/types';
import Header from './components/header';
import Footer from './components/footer';
import Login from './components/auth/login';
import Logout from './components/auth/logout';
import Profile from './components/auth/profile';
import Register from './components/auth/register';
import RequireAuth from './components/auth/require_auth';
import RequireUnauth from './components/auth/require_unauth';
import CruiseMenu from './components/cruise_menu';
import Users from './components/users';
import Tasks from './components/tasks';
import EventLogging from './components/event_logging';
import EventTemplates from './components/event_templates';
import Lowerings from './components/lowerings';
import LoweringReplay from './components/lowering_replay';
import LoweringSearch from './components/lowering_search';
import Cruises from './components/cruises';

import { library, dom } from '@fortawesome/fontawesome-svg-core';
import { faUser, faArrowLeft, faArrowRight, faPencilAlt, faTrash, faEye, faEyeSlash, faDownload, faComment, faExpand, faCompress, faStepBackward, faBackward, faPlay, faPause, faForward, faStepForward } from '@fortawesome/free-solid-svg-icons';

library.add(faUser, faArrowLeft, faArrowRight, faPencilAlt, faTrash, faEye, faEyeSlash, faDownload, faComment, faExpand, faCompress, faStepBackward, faBackward, faPlay, faPause, faForward, faStepForward);
// dom.i2svg();

require('typeface-roboto');

import store from './store';
import history from './history';

const cookies = new Cookies();

const token = cookies.get('token');
if (token) {

  store.dispatch({ type: AUTH_USER });

}

            // <Route path={ `/lowering_replay/:id` } exact={true} component={RequireAuth(LoweringReplay)} />
            // <Route path={ `/lowering_search/:id` } exact={true} component={RequireAuth(LoweringSearch)} />

ReactDOM.render(
  <Provider store={store}>
      <ConnectedRouter history={history}>
          <div>
            <Header />
            <Route path={ `/` } exact={true} component={RequireAuth(EventLogging)}/>
            <Route path={ `/github`} exact={true} component={() => window.location = 'https://github.com/webbpinner/sealog-client'}/>
            <Route path={ `/license`} exact={true} component={() => window.location = 'http://www.gnu.org/licenses/gpl-3.0.html'}/>
            <Route path={ `/profile` } exact={true} component={RequireAuth(Profile)} />
            <Route path={ `/register` } exact={true} component={Register} />
            <Route path={ `/login` } exact={true} component={RequireUnauth(Login)} />
            <Route path={ `/logout` } exact={true} component={Logout} />
            <Route path={ `/users` } exact={true} component={RequireAuth(Users)} />
            <Route path={ `/tasks` } exact={true} component={RequireAuth(Tasks)} />
            <Route path={ `/cruises` } exact={true} component={RequireAuth(Cruises)} />
            <Route path={ `/cruise_menu` } exact={true} component={RequireAuth(CruiseMenu)} />
            <Route path={ `/lowerings` } exact={true} component={RequireAuth(Lowerings)} />
            <Route path={ `/lowering_replay/:id` } exact={true} component={RequireAuth(LoweringReplay)} />
            <Route path={ `/lowering_search/:id` } exact={true} component={RequireAuth(LoweringSearch)} />
            <Route path={ `/event_templates` } exact={true} component={RequireAuth(EventTemplates)} />
            <Footer />
          </div>
      </ConnectedRouter>
  </Provider>
  , document.querySelector('.container'));
