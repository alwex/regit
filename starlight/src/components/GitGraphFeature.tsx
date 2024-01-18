import GitGraphWrapper from './GitGraphWrapper'

export default function GitGraphExample() {
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
                featureA.commit('commit1')

                const featureB = stable.branch('feature-b')
                featureB.commit('commit1')

                featureB.commit('commit1')
                featureB.commit('commit1')

                const featureC = stable.branch('feature-c')
                featureC.commit('commit1')
                featureC.commit('commit1')

                stable.commit('Initial Commit')
            }}
        </GitGraphWrapper>
    )
}
