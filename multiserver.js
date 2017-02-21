'use strict';

// multiserver: runs a bunch of server.js processes all sharing one port

// Does terminating this leave a whold bunch of prphaned node processes...
const cluster = require('cluster');
const nproc = require('os').cpus().length;

if(cluster.isMaster){
  
  function cleanup(code){
    // kill child workers
    console.warn('Exiting. Terminating child workers...');
    //for(let i=0, nw=workers.length; i<nw; i++){
    //  workers[i].kill();
    //}
    for(let i in cluster.workers){
      cluster.workers[i].kill();
    }
    console.log('Children killed. Terminating main process.');
    // comment this out to see event handler console.logs.
    // the program will exit anyway after all children die.
    //process.exit(code);
  }
  
  // These should be replaced by a single process.on('exit') handler.
  // But the stdout buffer will not flush, truncating console.blah() output.
  // This will *probably* get fixed in an upcoming node release.
  process.on('SIGINT', function(){
    cleanup(0);
  })
  process.on('SIGTERM', function(){
    cleanup(0);
  })
  
  cluster.on('fork',function(worker){
    // the 'connect' event handler never fires, why?
    console.log(`Child ${worker.id} came online`);
  });
  
  cluster.on('exit', function(worker, code, signal){
    console.log(`Child ${worker.id} died.`)
  });
  
  console.log('Forking children');
  for(let i=0; i<nproc; i++){
    let worker = cluster.fork();
  }
} else if(cluster.isWorker){
  // if it's a child, run a server process
  require('./server.js').run();
}
