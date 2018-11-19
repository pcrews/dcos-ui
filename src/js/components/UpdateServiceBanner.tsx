import React from "react";
import { Trans } from "@lingui/macro";
import { Observable, Subscribable } from "rxjs/Observable";
import { InfoBoxBanner } from "@dcos/ui-kit";
import { withRouter, InjectedRouter } from "react-router";
import { componentFromStream } from "data-service";
import {
  compare,
  setInLocalStorage,
  localStorageDismissedVersion
} from "../core/UpdateStream";

interface UpdateServiceBannerProps {
  router: InjectedRouter;
}

let isUpdating = false;

const UpdateServiceBanner = withRouter(
  componentFromStream<UpdateServiceBannerProps>(
    (
      props$: Subscribable<UpdateServiceBannerProps>
    ): Subscribable<React.ReactNode> => {
      return (props$ as Observable<UpdateServiceBannerProps>).combineLatest(
        compare.startWith(""),
        (props: UpdateServiceBannerProps, newVersion: string) => {
          function onDismiss() {
            setInLocalStorage("dismissedVersion", newVersion);
          }

          function goToReleaseNotes() {
            props.router.push({
              pathname: `/catalog/packages/dcos-ui?version=${newVersion}`
            });
          }

          function updateService() {
            // this.context.router.push({
            //   pathname: `/catalog/packages/dcos-ui/deploy?version=${this.props.newVersion}`
            // });

            // faking the "update"
            isUpdating = true;
            global.setTimeout(() => {
              onDismiss();
              isUpdating = false;
            }, 3000);
          }

          return newVersion &&
            newVersion !== localStorageDismissedVersion.getValue() ? (
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
                isUpdating ? (
                  <div className="button button-link button-auto-height disabled flush-left flush-right">
                    <Trans render="span">Updating...</Trans>
                  </div>
                ) : (
                  <div
                    className="button button-link button-primary button-auto-height flush-left flush-right"
                    tabIndex={0}
                    onClick={updateService}
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
                  onClick={goToReleaseNotes}
                  role="button"
                >
                  <Trans render="span">Release Notes</Trans>
                </div>
              }
              onDismiss={onDismiss}
            />
          ) : null;
        }
      );
    }
  )
);

export default UpdateServiceBanner;
