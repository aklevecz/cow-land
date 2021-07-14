import { createContext, useContext, useReducer } from "react";

type Action = { type: "MOVE_FORWARD" };

type Dispatch = (action: Action) => void;

type State = {
  moveForward: boolean;
};

const initialState = {
  moveForward: true,
};

const PlayerContext = createContext<
  { state: State; dispatch: Dispatch } | undefined
>(undefined);

const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case "MOVE_FORWARD":
      return { ...state, moveForward: true };
    default:
      return state;
  }
};

const PlayerProvider = ({
  children,
}: {
  children: JSX.Element | JSX.Element[];
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value = { state, dispatch };
  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
};

export { PlayerContext, PlayerProvider };
