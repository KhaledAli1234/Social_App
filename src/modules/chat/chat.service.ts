import { IAuthSocket } from "../gateway";

export class ChatService {
  constructor() {}
  sayHi = ({
    message,
    socket,
  }: {
    message: string;
    socket: IAuthSocket;
  }) => {
      console.log({ message });

  };
}
