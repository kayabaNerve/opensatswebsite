import { useRouter } from 'next/router'
import ErrorPage from 'next/error'
import { getPostBySlug, getAllPosts } from '../../utils/md'
import markdownToHtml from '../../utils/markdownToHtml'
import markdownStyles from '../../components/markdown-styles.module.css'
import Image from 'next/image'
import ProjectList from '../../components/ProjectList'
import BackToProjects from '../../components/BackToProjects'
import { ProjectItem, Stats } from '../../utils/types'
import { NextPage } from 'next/types'
import { useEffect, useState } from 'react'
import PaymentModal from '../../components/PaymentModal'
import Link from 'next/link'
import ShareButtons from '../../components/ShareButtons'
import { fetchPostJSON, fetchGetJSONAuthedBTCPay, fetchGetJSONAuthedStripe } from '../../utils/api-helpers'

type SingleProjectPageProps = {
  project: ProjectItem
  projects: ProjectItem[]
  stats: Stats
}



const Project: NextPage<SingleProjectPageProps> = ({ project, projects, stats }) => {
  const router = useRouter()

  const [modalOpen, setModalOpen] = useState(false)

  const [selectedProject, setSelectedProject] = useState<ProjectItem>()

  function closeModal() {
    setModalOpen(false)
  }

  function openPaymentModal() {
    console.log('opening single project modal...')
    setSelectedProject(project)
    setModalOpen(true)
  }

  const {
    slug,
    title,
    summary,
    coverImage,
    git,
    twitter,
    content,
    nym,
    website,
    personalTwitter,
  } = project


  function formatBtc(bitcoin: number) {
    if (bitcoin > 0.1) {
      return `₿ ${bitcoin.toFixed(3) || 0.00}`;
    } else {
      return `${Math.floor(bitcoin * 100000000).toLocaleString()} sats`
    }
  }

  function formatUsd(dollars: number): string {
    if (dollars == 0) {
      return ""
    } else if
      (dollars / 1000 > 1) {
      return `+ $${Math.round(dollars / 1000)}k`
    } else {
      return `+ $${dollars.toFixed(0)}`
    }
  }


  if (!router.isFallback && !slug) {
    return <ErrorPage statusCode={404} />
  }
  return (
    <>
      <div className="flex flex-col items-center">
        <div className={"h-[15rem] w-full relative bg-gradient-to-b from-white to-gray-200"}>
          <Image
            alt={title}
            src={coverImage}
            layout="fill"
            objectFit="contain"
            objectPosition="50% 50%"
          />
        </div>

        <div className="flex w-full p-4 py-8 md:px-8">
        </div>
        <article className="px-4 md:px-8 pb-8 lg:flex lg:flex-row-reverse lg:items-start">
          <aside className="p-4 bg-light rounded-xl flex lg:flex-col lg:items-start gap-4 min-w-[20rem] justify-between items-center mb-8">
            <button onClick={openPaymentModal}>Donate</button>
            {stats &&
              <div>
                <h5>Raised</h5>
                <h4>{`${formatUsd(stats.xmr.totaldonationsinfiat + stats.btc.totaldonationsinfiat + stats.usd.totaldonationsinfiat)}`}</h4>
                <h6>{stats.xmr.totaldonations} XMR</h6>
                <h6>{stats.btc.totaldonations} BTC</h6>
                <h6>{`${formatUsd(stats.usd.totaldonations)}`} Fiat</h6>
              </div>
            }

            {stats && <div>
              <h5>Donations</h5>
              <h4>{stats.xmr.numdonations + stats.btc.numdonations + stats.usd.numdonations}</h4>
              <h6>{stats.xmr.numdonations} in XMR</h6>
              <h6>{stats.btc.numdonations} in BTC</h6>
              <h6>{stats.usd.numdonations} in Fiat</h6>
            </div>
            }
          </aside>

          <div className={markdownStyles['markdown']}>
            <Link href={website}>
              <a className='!no-underline'>
                <h1>{title}</h1>
              </a>
            </Link>
            <p>{summary}</p>

            <p>
              by{' '}
              <Link href={`https://twitter.com/${personalTwitter || twitter}`} passHref>
                <a>{nym}</a>
              </Link >
            </p >
            <ShareButtons project={project} />
            <hr />
            {content && <div dangerouslySetInnerHTML={{ __html: content }} />}
          </div >
        </article >
      </div >
      <PaymentModal
        isOpen={modalOpen}
        onRequestClose={closeModal}
        project={selectedProject}
      />
    </>
  )
}

export default Project

export async function getServerSideProps({ params }: { params: any }) {
  const post = getPostBySlug(params.slug)

  const projects = getAllPosts()

  const content = await markdownToHtml(post.content || '')

  const crypto = await fetchGetJSONAuthedBTCPay()

  const xmr = await crypto.xmr
  const btc = await crypto.btc
  const usd = await fetchGetJSONAuthedStripe()

  const stats = { xmr, btc, usd }

  return {
    props: {
      project: {
        ...post,
        content,
      },
      projects,
      stats,
    },
  }
}


