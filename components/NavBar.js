import Link from "next/link";
import { AiFillGithub, AiFillLinkedin } from "react-icons/ai";

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
          <div className='lg:inline-flex lg:flex-row lg:ml-auto lg:w-auto w-full lg:items-center items-start  flex flex-col lg:h-auto'>
            <Link href='https://github.com/yodathecoda97' target='_blank' rel='noopener noreferrer'>
              <li className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded text-white font-bold items-center justify-center'>
                <AiFillGithub size={20} />
              </li>
            </Link>
            <Link href='https://www.linkedin.com/in/carlosl97/' target='_blank' rel='noopener noreferrer'>
              <li className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded text-white font-bold items-center justify-center'>
                <AiFillLinkedin size={20} /> {/* Replacing "Services" with LinkedIn icon */}
              </li>
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}

export default Navbar;