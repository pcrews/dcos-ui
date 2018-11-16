import { Component } from "react";

interface UpdateServiceBannerProps {
  onDismiss: () => void;
  newVersion: string;
}

export default class UpdateServiceBanner extends Component<
  UpdateServiceBannerProps,
  {}
> {}
