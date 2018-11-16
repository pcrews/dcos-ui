import React from "react";
import { Trans } from "@lingui/macro";
import { InfoBoxBanner } from "@dcos/ui-kit";
import { routerShape } from "react-router";

class UpdateServiceBanner extends React.Component {
  constructor(props) {
    super(props);

    // temporary to fake the "update"
    this.state = {
      isUpdating: false
    };

    this.goToReleaseNotes = this.goToReleaseNotes.bind(this);
    this.updateService = this.updateService.bind(this);
  }

  updateService() {
    // this.context.router.push({
    //   pathname: `/catalog/packages/dcos-ui/deploy?version=${this.props.newVersion}`
    // });

    // faking the "update"
    this.setState({ isUpdating: true });
    global.setTimeout(() => {
      this.props.onDismiss();
    }, 3000);
  }

  goToReleaseNotes() {
    this.context.router.push({
      pathname: `/catalog/packages/dcos-ui?version=${this.props.newVersion}`
    });
  }

  render() {
    const { newVersion, onDismiss } = this.props;

    return (
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
        onDismiss={onDismiss}
      />
    );
  }
}

UpdateServiceBanner.contextTypes = {
  router: routerShape
};

module.exports = UpdateServiceBanner;
