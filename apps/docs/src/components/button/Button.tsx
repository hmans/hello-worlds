import styled from "styled-components";

export const Button = styled.button`
  border-radius: 0.5em;
  padding: 0.5em 1em 0.5em;
  background: transparent;
  border: 0;
  cursor: pointer;
  &:hover {
    background: #dd3cff9c;
    color: #fff;
    background: #2f2f2f;
    box-shadow: 0 16px 40px -5px rgb(0 0 0 / 50%);
  }
`;
