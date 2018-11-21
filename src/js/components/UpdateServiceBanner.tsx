import React from "react";
import { Trans } from "@lingui/macro";
import { Observable, Subscribable } from "rxjs/Observable";
import { InfoBoxBanner } from "@dcos/ui-kit";
import { routerShape, InjectedRouter } from "react-router";
import { getContext } from "recompose";
import { componentFromStream } from "data-service";
import { request } from "@dcos/http-service";
import {
  compare,
  setInLocalStorage,
  localStorageDismissedVersion
} from "../core/UpdateStream";

interface UpdateServiceBannerProps {
  router: InjectedRouter;
}

let isUpdating = false;

const UpdateServiceBanner = getContext({
  router: routerShape
})(
  componentFromStream<UpdateServiceBannerProps>(
    (
      props$: Subscribable<UpdateServiceBannerProps>
    ): Subscribable<React.ReactNode> => {
      return (props$ as Observable<UpdateServiceBannerProps>).combineLatest(
        compare,
        localStorageDismissedVersion,
        (
          props: UpdateServiceBannerProps,
          newVersion: string,
          dismissedVersion: string
        ) => {
          function onDismiss() {
            setInLocalStorage("dismissedVersion", newVersion);
          }

          function goToReleaseNotes() {
            props.router.push({
              pathname: `/catalog/packages/dcos-ui?version=${newVersion}`
            });
          }

          function updatingOnError(code: string, message: string) {
            // temporary until we implement success/error toasts
            isUpdating = false;
            alert(`
              There was an error upgrading dcos-ui.
              Error code: ${code}
              Message: ${message}
            `);
          }

          function updatingOnComplete() {
            // console.log(
            //   `window.DCOS_UI_VERSION after update: ${window.DCOS_UI_VERSION}`
            // );
            onDismiss();
          }

          function updateService() {
            isUpdating = true;
            request(`/dcos-ui-service/api/v1/update/${newVersion}/`, {
              method: "POST"
            })
              .retry(4)
              .subscribe({
                error: ({ code, message }) => updatingOnError(code, message),
                complete: () => updatingOnComplete()
              });
          }

          return newVersion !== dismissedVersion ? (
            <InfoBoxBanner
              appearance="info"
              message={
                <Trans render="span" className="bannerMessage">
                  A new version ({newVersion}) of the DC/OS
                </Trans>
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
