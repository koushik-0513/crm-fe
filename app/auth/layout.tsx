import React from 'react'

type TAuthLayoutProps = {
  children: React.ReactNode;
}

function authlayout({children}: TAuthLayoutProps) {
  return (
    <>
      {children}
    </>
  )
}

export default authlayout
