import GitGraphWrapper from './GitGraphWrapper'

export default function GitGraphPreview() {
    return (
        <GitGraphWrapper>
            {(gitgraph) => {
                const stable = gitgraph.branch({
                    name: 'stable',
                })
                stable.commit('Initial Commit')

                stable.tag({ name: 'v1.0.0' })

                const featureA = stable.branch('feature-a')
                featureA.commit('commit1')
                featureA.commit('commit1')

                const featureB = stable.branch('feature-b')
                featureB.commit('commit1')
                featureB.commit('commit1')

                const preview = stable.branch('preview-staging')
                preview.merge(featureA)
                preview.merge(featureB)

                stable.commit('Initial Commit')
            }}
        </GitGraphWrapper>
    )
}
