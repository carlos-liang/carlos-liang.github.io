import Link from "next/link";

const Navbar = () => {
  return (
    <>
      <nav className='absolute flex items-center flex-wrap p-3 px-16 z-50 w-full'>
        <Link href='/'>
          <li className='inline-flex items-center p-2 mr-4 '>
            <span className='text-xl text-white font-bold tracking-wide'>
              Carlos Liang
            </span>
          </li>
        </Link>
        <div className='absolute right-0 mr-10 w-full lg:flex-grow lg:w-auto'>
          <div className='lg:inline-flex lg:flex-row lg:ml-auto lg:w-auto w-full lg:items-center items-start flex flex-col lg:h-auto'>
          </div>
        </div>
      </nav>
    </>
  )
}

export default Navbar;
