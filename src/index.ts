import * as k8s from '@kubernetes/client-node';
import * as request from 'request';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const opts : request.Options = {} as any;
kc.applyToRequest(opts);

function getPodNames(namespace: string) : Promise<string[]> {
    return new Promise((resolve, reject) => {
        request.get(`${kc.getCurrentCluster()?.server}/api/v1/namespaces/${namespace}/pods`, opts,
        (error, response, body) => {
            if (error) {
                reject(error);
            }
            else {
                console.log(`statusCode: ${response.statusCode}`);
                if (response) {
                    const pods = JSON.parse(body).items;
                    resolve(pods.map(pod => { var _a; return (_a = pod === null || pod === void 0 ? void 0 : pod.metadata) === null || _a === void 0 ? void 0 : _a.name; }));
                }
                else {
                    reject("Didn't get a response");
                }
            }
        });
    });
}

function getKnativeServices(namespace: string, labelSelector: string) : Promise<any[]> {
    return new Promise((resolve, reject) => {
        request.get(`${kc.getCurrentCluster()?.server}/apis/serving.knative.dev/v1/namespaces/${namespace}/services`, 
            {...opts, qs: {labelSelector}},
            (error, response, body) => {
                if (error) {
                    reject(error);
                } else {
                    const services = JSON.parse(body).items;
                    resolve(services);
                }
            }
        )
    });
}

async function getWorkloadUrl(namespace: string, workloadName: string) : Promise<String> {
    const services = await getKnativeServices(namespace, `carto.run/workload-name=${workloadName}`);
    for (let i = 0; i < services.length; i++) {
        const url = services[i]?.status?.url;
        if (url) {
            return url;
        }
    }
    throw new Error('Url not found for workload')
}
 
//getPodNames('default').then(ns => console.log(ns));

// getKnativeServices('default', 'carto.run/workload-name=hello-boot').then(services => {
//     console.log(services);
// });

getWorkloadUrl('default', 'hello-boot').then(url => {
    console.log(`url = ${url}`)
})