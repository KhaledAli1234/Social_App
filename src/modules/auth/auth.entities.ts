export interface ILoginResponse {
  credentials: {
    access_token: string;
    refresh_token: string;
  };
}
