import * as React from "react";
import Kingdom from "./index";

const Demographics: React.FC = () => {
  return (
    <button
      onClick={() => {
        const kingdom = new Kingdom();
        console.log({ kingdom });
      }}
    >
      Roll Kingdom
    </button>
  );
};

export default Demographics;
