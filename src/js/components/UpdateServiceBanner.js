import React from "react";
import { Trans } from "@lingui/macro";
import { InfoBoxBanner } from "@dcos/ui-kit";
import { routerShape } from "react-router";
import { setInLocalStorage } from "../core/UpdateStream";

export default class UpdateServiceBanner extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isUpdating: false, // temporary to fake the "update"
      isShown: false
    };

    this.goToReleaseNotes = this.goToReleaseNotes.bind(this);
    this.updateService = this.updateService.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const { newVersion, dismissedVersion } = nextProps;

    this.setState({
      isShown: newVersion && dismissedVersion !== newVersion
    });
  }

  onDismiss() {
    setInLocalStorage("dismissedVersion", this.props.newVersion);
    // this.setState({ isShown: false });
  }

  updateService() {
    // this.context.router.push({
    //   pathname: `/catalog/packages/dcos-ui/deploy?version=${this.props.newVersion}`
    // });

    // faking the "update"
    this.setState({ isUpdating: true });
    global.setTimeout(() => {
      this.onDismiss();
    }, 3000);
  }

  goToReleaseNotes() {
    this.context.router.push({
      pathname: `/catalog/packages/dcos-ui?version=${this.props.newVersion}`
    });
  }

  render() {
    const { newVersion } = this.props;

    return this.state.isShown ? (
      <InfoBoxBanner
        appearance="info"
        message={
          <span>
            <Trans render="span">
              A new version ({newVersion}) of the DC/OS
            </Trans>
          </span>
        }
        primaryAction={
          this.state.isUpdating ? (
            <div className="button button-link button-auto-height disabled flush-left flush-right">
              <Trans render="span">Updating...</Trans>
            </div>
          ) : (
            <div
              className="button button-link button-primary button-auto-height flush-left flush-right"
              tabIndex={0}
              onClick={this.updateService}
              role="button"
            >
              <Trans render="span">Start Update</Trans>
            </div>
          )
        }
        secondaryAction={
          <div
            className="button button-link button-primary button-auto-height flush-left flush-right"
            tabIndex={0}
            onClick={this.goToReleaseNotes}
            role="button"
          >
            <Trans render="span">Release Notes</Trans>
          </div>
        }
        onDismiss={this.onDismiss}
      />
    ) : null;
  }
}

UpdateServiceBanner.contextTypes = {
  router: routerShape
};
