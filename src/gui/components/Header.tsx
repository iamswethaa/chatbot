import React from "react"; 

const Header: React.FunctionComponent = () => {
  return (
    <div className="font-bold text-2xl p-4 border border-b-zinc-800 border-app bg-muted text-black flex items-center">
        <h1>Sample App</h1>
    </div>
  );
};

export default Header;